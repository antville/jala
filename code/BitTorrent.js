//
// Jala Project [http://opensvn.csie.org/traccgi/jala]
//
// Copyright 2004 ORF Online und Teletext GmbH
//
// Licensed under the Apache License, Version 2.0 (the ``License'');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an ``AS IS'' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// $Revision$
// $LastChangedBy$
// $LastChangedDate$
// $HeadURL$
//


/**
 * @fileoverview Fields and methods of the jala.BitTorrent class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * HelmaLib dependencies
 */
app.addRepository("modules/core/String.js");


/**
 * Constructs a new BitTorrent file.
 * @class This class provides methods to create a BitTorrent
 * metadata file from any desired file.
 * @param {String} trackerUrl The URL string of the tracker.
 * @param {String} filePath The path to the original file.
 * @returns A new BitTorrent file.
 * @constructor
 */
jala.BitTorrent = function(trackerUrl, filePath) {
   var self = this;
   self.arguments = arguments;

   // FIXME: add support for multi-file mode
   // FIXME: improve digest loop in write method

   var pieceLength = 256;

   var torrent = {
      announce: trackerUrl,
      "announce-list": null,
      "creation date": null,
      comment: null,
      "created by": null
   };

   /**
    * Get all available property names.
    * @returns The list of property names.
    * @type Array
    */
   this.keys = function() {
      var keys = [];
      for (var i in torrent) {
         keys.push(i);
      }
      keys.sort();
      return keys;
   };

   /**
    * Get a torrent property.
    * @param {String} name The name of the property.
    * @returns The value of the property.
    */
   this.get = function(name) {
      return torrent[name];
   };

   /**
    * Set a torrent property.
    * @param {String} name The name of the property.
    * @param {Object} value The property's value.
    */
   this.set = function(name, value) {
      if (typeof torrent[name] == "undefined")
         throw Error("Cannot set torrent property " + name);
      torrent[name] = value;
      return;
   };

   /**
    * Get the creation date of the torrent.
    * @returns The torrent's creation date.
    * @type Date
    */
   this.getCreationDate = function() {
      return new Date(torrent["creation date"] * 1000);
   };

   /**
    * Set the creation date of the torrent.
    * @param {Date} date The desired creation date.
    */
   this.setCreationDate = function(date) {
      torrent["creation date"] = 
         Math.round((date || new Date()).getTime() / 1000);
      return;
   };

   /**
    * Get the piece length of the torrent.
    * @returns The torrent's piece length.
    * @type Number
    */
   this.getPieceLength = function() {
      return pieceLength;
   };

   /**
    * Set the piece length of the torrent.
    * @param {Number} length The desired piece length.
    */
   this.setPieceLength = function(length) {
      pieceLength = length;
      return;
   };

   /**
    * Write the torrent to a file.
    * @param {String} filename An optional filename.
    * The default filename is the name of the original file
    * plus ".torrent" as suffix.
    * @returns The bencoded torrent.
    * @type String
    */
   this.write = function(filename) {
      var file = new java.io.File(self.arguments[1]);
      if (!file.exists())
         throw Error("File " + file + " does not exist!");
   
      var pieces = [];

      var md = java.security.MessageDigest.getInstance("SHA-1");
      var fis = new java.io.FileInputStream(file);
      var bis = new java.io.BufferedInputStream(fis);
      var baos = new java.io.ByteArrayOutputStream();
      var cache = new java.io.ByteArrayOutputStream();
   
      function addDigest() {
         var byteArray = baos.toByteArray();
         md.reset();
         //md.update(byteArray)  // FIXME: throws ambiguousity exception
         md.update(byteArray, 0, byteArray.length);
         pieces.push(new java.lang.String(md.digest()));
         return;
      }
   
      var ch, counter = 1, max = pieceLength * 1024;
      while ((ch = bis.read()) != -1) {
         baos.write(ch);
         if (counter > max) {
            addDigest();
            counter = 0;
            baos.reset();
         }
         counter += 1;
         cache.write(ch);
      }
      addDigest();

      md = java.security.MessageDigest.getInstance("MD5");
      var content = cache.toByteArray();
      var checksum = new java.lang.String(md.digest(content));

      baos.close();
      bis.close();
      fis.close();
      cache.close();

      torrent.info = {
         //md5sum: checksum,
         length: content.length,
         name: file.getName(),
         "piece length": max,
         pieces: pieces.join("")
      };

      if (!filename)
         filename = torrent.info.name + ".torrent";

      var output = jala.BitTorrent.bencode(torrent);
      delete torrent.info;

      file = new helma.File(file.getParent(), filename);
      file.remove();
      file.open();
      file.write(output);
      file.close();

      return output;
   };

   /**
    * Get a string representation of the torrent.
    * @returns The torrent as string.
    * @type String
    */
   this.toString = function() {
      return "[jala.BitTorrent " + filePath + "]";
   };

   this.setCreationDate();
   return this;
};


/**
 * The bencode method. Turns an arbitrary JavaScript
 * object structure into a corresponding encoded
 * string.
 * @param {Object} obj The target JavaScript object.
 * @returns The encoded string.
 * @type String
 */
jala.BitTorrent.bencode = function(obj) {
   var bencode = arguments.callee;
   var str = obj.toString();
   res.push();
   switch (obj.constructor) {
      case Array:
         res.write("l");
         for (var i in obj) {
            if (obj[i])
               res.write(bencode(obj[i]));
         }
         res.write("e");
         break;

      case Number:
         res.write("i" + str + "e");
         break;

      case Object:
         res.write("d");
         var keys = [];
         for (var i in obj) {
            keys.push(i);
         }
         keys.sort();
         var key;
         for (var i in keys) {
            key = keys[i];
            if (obj[key]) {
               res.write(bencode(key));
               res.write(bencode(obj[key]));
            }
         }
         res.write("e");
         break;

      default:
         res.write(str.length + ":" + str);
   }
   return res.pop();
};


/**
 * The bdecode method. Turns an encoded string into
 * a corresponding JavaScript object structure.
 * FIXME: Handle with caution...
 * @param {String} code The encoded string.
 * @returns The decoded JavaScript structure.
 * @type Object
 */
jala.BitTorrent.bdecode = function(code) {
   var DICTIONARY = "d";
   var LIST       = "l";
   var INTEGER    = "i";
   var STRING     = "s";
   var END        = "e";

   var stack = [];
   var overflowCounter = 0;

   var position = -1, current;

   function getResult() {
      update();
      var result;
      switch (current) {
         case DICTIONARY:
            result = bdecodeDictionary();
            break;
         case LIST:
            result = bdecodeList();
            break;
         case INTEGER:
            result = bdecodeInteger();
            break;
         case END:
         case null:
            //res.debug("*** end detected in getResult()");
            break;
         default:
            result = bdecodeString();               
      }
      return result;
   }

   function update() {
      position += 1;
      current = code.charAt(position);
      /* res.debug("stack: " + stack);
      res.debug("position: " + position);
      res.debug("current: " + current);
      res.debug("remains: " + code.substr(position)); */
      return;
   }

   function overflow() {
      if (overflowCounter++ > 100)
         throw Error("Error parsing bdecoded string");
      return false;
   }

   function bdecodeDictionary() {
      stack.push(DICTIONARY);
      var dictionary = {}, key, value;
      while (current && !overflow()) {
         key = getResult();
         value = getResult();
         if (key && value)
            dictionary[key] = value;
         else
            break;
      }
      stack.pop();
      return dictionary;
   }

   function bdecodeList() {
      stack.push(LIST);
      var list = [], value;
      while (current && !overflow()) {
         var value = getResult();
         if (value)
            list.push(value);
         else
            break;
      }
      stack.pop();
      return list;
   }

   function bdecodeInteger() {
      var integer = "";
      stack.push(integer);
      while (current && !overflow()) {
         update();
         if (current == "e")
            break;
         integer += current;
      }
      if (isNaN(integer))
         throw("Error in bdecoded integer: " + integer + " is not a number");
      //res.debug("integer = " + integer);
      stack.pop();
      return parseInt(integer);
   }

   function bdecodeString() {
      var length = current, string = "";
      stack.push(string);
      update();
      while (current && current != ":" && !overflow()) {
         length += current;
         update();
      }
      if (isNaN(length))
         throw("Error in bdecoded string: invalid length " + length);
      //res.debug("length = " + length);
      length = parseInt(length);
      if (length > code.length - position)
         throw Error("Error parsing bdecoded string");
      for (var i=0; i<length; i+=1) {
         update();
         string += current;
      }
      //res.debug("string = " + string);
      if (string == "creation date")
         void(null);
      stack.pop();
      return string;
   }

   return getResult();
};
