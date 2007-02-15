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
 * Constructs a name from an object which
 * is unique in the underlying HopObject collection. 
 * @param {Object} obj The object representing or containing the alias name.
 * Possible object types include:
 * <ul>
 * <li>File</li>
 * <li>helma.File</li>
 * <li>java.io.File</li>
 * <li>String</li>
 * <li>java.lang.String</li>
 * </ul>
 * @param {HopObject} collection The collection the alias 
 * potentially should be added to
 * @param {Number} maxLength The maximum length of the alias
 * @returns The resulting alias
 * @type String
 */
jala.Utilities.prototype.getAlias = function(obj, collection, maxLength) {
   var name;
   var clazz = obj.constructor || obj.getClass();
   switch (clazz) {
      case File:
      case helma.File:
      case java.io.File:
      case Packages.helma.util.MimePart:
      // first fix bloody ie/win file paths containing backslashes
      var rawName = obj.getName().replace(/\\/g, "/");
      rawName = rawName.split("/");
      name = rawName.pop();
      if (name.contains("."))
         name = name.substring(0, name.lastIndexOf("."));
      break;
      
      case String:
      case java.lang.String:
      name = obj;
      break;

      default:
      name = obj.toString();
   }

   // convert alias to lowercase and clean it from any invalid characters
   var alias = name.toLowerCase().toFileName();
   var len = alias.length;
   var counter = 0;

   var getAlias = function() {
      var overflow;
      if (maxLength) {
         if (counter) {
            len += counter.toString().length;
         }
         if ((overflow = len - maxLength) > 0) {
            alias = alias.substring(0, alias.length - overflow);
            len = alias.length;
         }
      }
      return (counter ? alias + counter.toString() : alias);
   }

   if (collection) {
      var alias;
      do {
         alias = getAlias();
         counter += 1;
      } while (collection[alias] || collection.get(alias));
      return alias;
   }
   return getAlias();
};

/**
 * Creates a random password with different levels of security.
 * @param {Number} len The length of the password (default: 8)
 * @param {Number} level The security level
 * <ul>
 * <li>0 - containing only vowels or consonants (default)</li>
 * <li>1 - throws in a number at random position</li>
 * <li>2 - throws in a number and a special character at random position</li>
 * </ul>
 * @returns The resulting password
 * @type String
 */
jala.Utilities.prototype.createPassword = function(len, level) {
   len = len || 8;
   level = level || 0;

   var LETTERSONLY  = 0;
   var WITHNUMBERS  = 1;
   var WITHSPECIALS = 2;
   
   var vowels     = ['a', 'e', 'i', 'o', 'u'];
   var consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];
   var specials   = ['.', '#', '!', '$', '%', '&', '?'];

   var posNum     = level > LETTERSONLY ? Math.floor(Math.random() * (len - 2)) : -1;
   var posSpecial = level > WITHNUMBERS ? Math.floor(Math.random() * (len - 3)) : -2;
   if (posNum == posSpecial) {
      posSpecial += 1;
   }

   res.push();
   // loop to create characters:
   var i, rnd;
   for (i=0; i<(len-level); i+=1) {
      if(i % 2 == 0) {
         // every 2nd one is a vowel
         rnd = Math.floor(Math.random() * vowels.length);
         res.write(vowels[rnd]);
      } else {
         // every 2nd one is a consonant
         rnd = Math.floor(Math.random() * consonants.length);
         res.write(consonants[rnd]);
      }
      if (i == posNum) {
         // increased password security:
         // throw in a number at random
         rnd = Math.floor(Math.random() * specials.length);
         res.write(String(rnd + 1));
      }
      if (i == posSpecial) {
         // increased password security:
         // throw in a number at random
         rnd = Math.floor(Math.random() * specials.length);
         res.write(specials[rnd]);
      }
   }
   return res.pop();
};

/**
 * Static field indicating a removed object property.
 * @type Number
 * @final
 */
jala.Utilities.VALUE_REMOVED = -1;

/**
 * Static field indicating ad added object property.
 * @type Number
 * @final
 */
jala.Utilities.VALUE_ADDED = 1;

/**
 * Static field indicating a modified object property.
 * @type Number
 * @final
 */
jala.Utilities.VALUE_MODIFIED = 2;

/**
 * Returns an array containing the properties that are 
 * added, removed or modified in one object compared to another.
 * @param {Object} obj1 The first of two objects which should be compared
 * @param {Object} obj2 The second of two objects which should be compared
 * @returns An Object containing all properties that are added, removed
 * or modified in the second object compared to the first. 
 * Each property contains a status field with an integer value 
 * which can be checked against the static jala.Utility fields 
 * VALUE_ADDED, VALUE_MODIFIED and VALUE_REMOVED.
 * @type Object
 */
jala.Utilities.prototype.diffObjects = function(obj1, obj2) {
   var childDiff, value1, value2;
   var diff = {};
   var foundDiff = false;

   for (var propName in obj1) {
      if (obj2[propName] === undefined || obj2[propName] === "" || obj2[propName] === null) {
         diff[propName] = {status: jala.Utilities.VALUE_REMOVED};
         foundDiff = true;
      }
   }
   for (var propName in obj2) {
      value1 = obj1[propName];
      value2 = obj2[propName];
      switch (value2.constructor) {
         case HopObject:
         case Object:
            if (childDiff = Jala.Utility.prototype.diffObjects(value1, value2)) {
               diff[propName] = childDiff;
               foundDiff = true;
            }
            break;
         default:
            if (value2 != null && value2 !== "") {
               if (value1 === null || value1 === undefined || value1 === "") {
                  diff[propName] = {status: jala.Utilities.VALUE_ADDED,
                                    value: value2};
                  foundDiff = true;
               } else if (value1 != value2) {
                  diff[propName] = {status: jala.Utilities.VALUE_MODIFIED,
                                    value: value2};
                  foundDiff = true;
               }
            }
            break;
      }
   }
   return foundDiff ? diff : null;
};

/**
 * Patches an object with a "diff" object created by the 
 * {@link #diffObjects} method.
 * Please mind that this method is recursive, it descends
 * along the "diff" object structure.
 * @param {Object} obj The Object the diff should be applied to
 * @param {Object} diff A "diff" object created by the {@link #diffObjects} method
 * @returns The patched Object with all differences applied
 * @type Object
 */
jala.Utilities.prototype.patchObject = function(obj, diff) {
   var propDiff, value1;
   for (var propName in diff) {
      propDiff = diff[propName];
      value1 = obj[propName];
      if (propDiff.status != null) {
         switch (propDiff.status) {
            case jala.Utilities.VALUE_REMOVED:
               // app.debug("applyDiff(): removing property " + propName);
               delete obj[propName];
               break;
            case jala.Utilities.VALUE_ADDED:
            case jala.Utilities.VALUE_MODIFIED:
            default:
               // app.debug("applyDiff(): changing property " + propName + " to " + propDiff.value);
               obj[propName] = propDiff.value;
               break;
         }
      } else {
         // app.debug("applyDiff(): descending to child object " + propName);
         jala.Utilities.patchObject(value1, propDiff);
      }
   }
   return obj;
};
