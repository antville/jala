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
 * @fileoverview Fields and methods of the jala.Utilities class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * HelmaLib dependencies
 */
app.addRepository("modules/core/Number.js");


/**
 * Construct a utility object.
 * @class This class contains various convenience methods
 * which do not fit in any other class.
 * @returns A new utitilty object.
 * @constructor
 */
jala.Utilities = function() {
   return this;
};


/**
 * Return a string representation of the utitility class.
 * @returns [jala.Utilities]
 * @type String
 * @ignore FIXME: JSDoc bug
 */
jala.Utilities.toString = function() {
   return "[jala.Utilities]";
};


/**
 * Return a string representation of the utitility object.
 * @returns [jala.Utilities Object]
 * @type String
 */
jala.Utilities.prototype.toString = function() {
   return "[jala.Utilities Object]";
};


/**
 * Default utility class instance.
 * @type jala.Utilities
 * @final
 */
jala.util = new jala.Utilities();


/**
 * dump an object tree to response
 */
jala.Utilities.prototype.dumpTree = function(obj, lvl) {
   if (lvl == null)
      var lvl = 0;
   for (var i in obj) {
      res.write(("---").repeat(lvl) + i + " = " + obj[i] + "<br />");
      if (obj[i]) {
         if (obj[i] instanceof HopObject)
            this.dumpTree(obj[i], lvl+1);
         else if (typeof obj[i] == "object")
            this.dumpTree(obj[i], lvl+1);
      }
   }
   if (obj && obj instanceof HopObject) {
      for (var i=0;i<obj.size();i++) {
         this.dumpTree(obj.get(i), lvl+1);
      }
   }
   return;
};


/**
 * function extracts all date editor related form values
 * from the req.data object passed as argument and tries
 * to parse them to a Date object
 * @param Object Object containing the submitted form values
 * @param Object Array containing the format pattern parts
 * @param String format pattern to use (optional)
 * @return Object Date object
 * @see renderDateEditor()
 */
jala.Utilities.prototype.extractDate = function(param, prefix, fmt) {
   if (!fmt)
      var fmt = ["dd", "MM", "yyyy", "HH", "mm"];
   var str = "";
   var value;
   for (var i in fmt) {
      if (value = param[prefix + ":" + fmt[i]])
         str += value;
   }
   var pattern = fmt.join("");
   if (str.length == 0)
      return null;
   else if (pattern.length != str.length)
      throw new Error();
   return str.toDate(pattern);
};


/**
 * function caches the dateSymbols in app.data.dateSymbols
 * because they're not thread-safe and quite expensive
 * FIXME: don't cache in app.data here
 */
jala.Utilities.prototype.getDateSymbols = function() {
   if (app.data.dateSymbols)
      return app.data.dateSymbols;
   app.data.dateSymbols = new java.text.DateFormatSymbols();
   return app.data.dateSymbols;
};


/**
 * function gets a MimePart passed as argument and
 * constructs an object-alias based on the name of the uploaded file
 * @param Obj MimePart-Object
 * @param Obj Destination collection
 * @param Int maximum length of alias to return
 */
jala.Utilities.prototype.buildAliasFromFile = function(uploadFile, collection, maxLength) {
   // first fix bloody ie/win file paths containing backslashes
   var rawName = uploadFile.getName().replace(/\\/g, "/");
   rawName = rawName.split("/");
   var filename = rawName.pop();
   if (filename.contains("."))
      filename = filename.substring(0, filename.lastIndexOf("."));
   return this.buildAlias(filename, collection, maxLength);
};


/**
 * function gets a String passed as argument and
 * constructs an object-alias which is unique in
 * a collection
 * @param String proposed alias for object
 * @param Obj Destination collection
 * @param Int maximum length of alias to return
 * @return String determined name
 */
jala.Utilities.prototype.buildAlias = function(str, collection, maxLength) {
   // convert alias to lowercase and clean it from any invalid characters
   var alias = str.toLowerCase().toFileName();
   var l = alias.length;

   var getTrimmedAlias = function() {
      var overflow;
      if (maxLength) {
         if (nr)
            l += nr.toString().length;
         if ((overflow = l - maxLength) > 0) {
            alias = alias.substring(0, alias.length - overflow);
            l = alias.length;
         }
      }
      return (nr ? alias + nr.toString() : alias);
   }
   if (collection && collection.get(getTrimmedAlias())) {
      // if alias is already existing in collection, so we append a number
      var nr = 1;
      while (collection.get(getTrimmedAlias())) {
         nr++;
      }
      return alias + nr.toString();
   } else {
      return getTrimmedAlias();
   }
};


/**
 * generates a random password with different levels of security
 * 0 = vowels or consonants (default)
 * 1 = throws in a number at random position
 * 2 = throws in a number and a special character at random position
 * @param Number length of password
 * @param Number setting security level (0|1|2)
 * @returns String password
 */
jala.Utilities.prototype.randomPassword = function(len, level) {
   var len = (len==null) ? 8 : len;
   var level = (level==null) ? 0 : level;
   var vowels     = ["a", "e", "i", "o", "u"];
   var consonants = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z"];
   var special    = [".", "#", "!", "$", "%", "&", "?"];
   var sb = new java.lang.StringBuffer();
   var posNum     = (level && level>0) ? Math.floor(Math.random()*(len-2)) : -1;
   var posSpecial = (level && level>1) ? Math.floor(Math.random()*(len-3)) : -2;
   if (posNum==posSpecial) {
      posSpecial++;
   }
   // loop to create characters:
   for (var i=0; i<(len-level); i++) {
      if((i % 2)==0) {
         // every 2nd one is a vowel
         var rnd = Math.floor(Math.random()*5);
         sb.append(vowels[rnd]);
      } else {
         // every 2nd one is a consonant
         var rnd = Math.floor(Math.random()*21);
         sb.append(consonants[rnd]);
      }
      if (i==posNum) {
         // increased password security:
         // throw in a number at random
         var rnd = Math.floor(Math.random()*8);
         sb.append(String(rnd+1));
      }
      if (i==posSpecial) {
         // increased password security:
         // throw in a number at random
         var rnd = Math.floor(Math.random()*special.length);
         sb.append(special[rnd]);
      }
   }
   return sb.toString();
};


/**
 * checks if the group is available.
 */
jala.Utilities.prototype.isGroupAvailable = function(name) {
    try {
      return groups.isConnected(name);
   } catch (e) {
      try {
         return group.isConnected(name);
      } catch (e) {
         return false;
      }
   }
};


/**
 * function receives a DOM Node as argument and converts it into
 * a JS object (this method calls itself recursively for child nodes!)
 * @param Obj DOM Node
 * @return Obj Javascript object
 */
jala.Utilities.prototype.convertNode = function(node) {
   var result = new Object();
   var name = node.getNodeName();
   if (node.hasAttributes()) {
      var attrList = node.getAttributes();
      var len = attrList.getLength();
      for (var n=0; n<len; n++) {
         var attr = attrList.item(n);
         result[attr.getNodeName()] = attr.getNodeValue();
      }
   }
   if (node.hasChildNodes()) {
      var Node = Packages.org.w3c.dom.Node;
      var childNodes = node.getChildNodes();
      var max = childNodes.getLength();
      for (var i=0; i<max; i++) {
         var child = childNodes.item(i);
         if (child.getNodeType() == Node.TEXT_NODE && child.getNodeValue().trim() != "") {
            result.value = child.getNodeValue();
         } else if (child.getNodeType() == Node.ELEMENT_NODE) {
            result[child.getNodeName()] = this.convertNode(child);
         }
      }
   }
   return result;
};


/**
 * function sending mail using helma.Mail. if smtp field is not set in
 * app.properties, the mail is written as plain text to appdir/.mail
 * for debugging purposses.
 * @param {String} from sender's address
 * @param {String} to receipient's address
 * @param {String} subject mail subject
 * @param {String} body mail body
 */
jala.Utilities.prototype.sendMail = function(from, to, subject, body) {
   if (app.properties["smtp"]) {
      var m = new helma.Mail();
      m.setFrom(from);
      m.addTo(to);
      m.setSubject(subject);
      m.addText(body);
      m.send();
   } else {
      var str = "From: " + from + "\n";
      str += "To: " + to + "\n";
      str += "Subject: " + subject + "\n";
      str += "\n";
      str += body + "\n";
      var dir = new helma.File(app.dir, ".mail");
      if (!dir.exists()) {
         dir.makeDirectory();
      }
      var maxId = 0;
      var arr = dir.list(/[0-9]+\.txt/);
      for (var i in arr) {
         var partOfFileName = arr[i].substring(0, arr[i].length - 4);
         partOfFileName++;
         if(partOfFileName > maxId) {
            maxId = partOfFileName;
         }
      }
      if (maxId < 10000) {
         var f = new helma.File(dir, maxId.format("0000") + ".txt");
         f.open();
         f.write(str);
         f.close();
      } else {
         app.log("ERROR in jala.Utilities.prototype.sendMail: more than 10.000 messages in trace directory, couldn't write debug mail to app.dir/.mail");
      }
   }
};
