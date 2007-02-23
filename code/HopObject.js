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

/**
 * HelmaLib dependencies
 */
app.addRepository("modules/core/String.js");

/**
 * Constructs a name from an object which
 * is unique in the underlying HopObject collection. 
 * @param {Object} obj The object representing or containing
 * the alias name. Possible object types include:
 * <ul>
 * <li>File</li>
 * <li>helma.File</li>
 * <li>java.io.File</li>
 * <li>String</li>
 * <li>java.lang.String</li>
 * </ul>
 * @param {Number} maxLength The maximum length of the alias
 * @returns The resulting alias
 * @type String
 */
HopObject.prototype.getAccessName = function(obj, maxLength) {
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

   // convert accessName to lowercase and clean it from any invalid characters
   var accessName = name.toLowerCase().toFileName();
   var len = accessName.length;
   var counter = 0;
   var overflow;
   
   do {
      if (maxLength) {
         if (counter) {
            len += counter.toString().length;
         }
         if ((overflow = len - maxLength) > 0) {
            accessName = accessName.substring(0, accessName.length - overflow);
            len = accessName.length;
         }
      }
      if (counter) {
         accessName = accessName + counter.toString();
      }
      counter += 1;
   } while (collection[accessName] || collection.get(accessName));
   
   return accessName;
};
