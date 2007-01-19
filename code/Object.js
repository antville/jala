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
 * @fileoverview Fields and methods of the jala.Object class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Constructs a new Object object.
 * @class This class provides various that can be
 * applied on Objects and HopObjects.
 * @constructor
 */
jala.Object = function() {
   return this;
};


/**
 * Returns an array containing those properties that
 * are added/removed/modified in obj2 compared to obj1
 * @param {Object} The basis object that should be compared with.
 * @param {Object} The object that should be compared with the previous argument.
 * @returns An Object containing all properties that have changed
 * between the two "revisions". Each property contains an integer
 * which can be checked using the static fields ADDED, MODIFIED and REMOVED.
 * @type Object
 */
jala.Object.prototype.diff = function(obj1, obj2) {
   var childDiff, value1, value2;
   var diff = {};
   var foundDiff = false;

   for (var propName in obj1) {
      if (obj2[propName] === undefined || obj2[propName] === "" || obj2[propName] === null) {
         diff[propName] = {status: jala.Object.REMOVED};
         foundDiff = true;
      }
   }
   for (var propName in obj2) {
      value1 = obj1[propName];
      value2 = obj2[propName];
      switch (value2.constructor) {
         case HopObject:
         case Object:
            if (childDiff = jala.object.diff(value1, value2)) {
               diff[propName] = childDiff;
               foundDiff = true;
            }
            break;
         default:
            if (value2 != null && value2 !== "") {
               if (value1 === null || value1 === undefined || value1 === "") {
                  diff[propName] = {status: jala.Object.ADDED,
                                    value: value2};
                  foundDiff = true;
               } else if (value1 != value2) {
                  diff[propName] = {status: jala.Object.MODIFIED,
                                    value: value2};
                  foundDiff = true;
               }
            }
            break;
      }
   }
   return foundDiff ? diff : null;
}

/**
 * Static field indicating a removed object property.
 * @type Number
 * @final
 */
jala.Object.REMOVED = -1;

/**
 * Static field indicating ad added object property.
 * @type Number
 * @final
 */
jala.Object.ADDED = 1;

/**
 * Static field indicating a modified object property.
 * @type Number
 * @final
 */
jala.Object.MODIFIED = 2;
   

/**
 * Applies a diff object(-tree) to the object passed as argument.
 * Please mind that this method is recursive, it descends
 * along the diff tree.
 * @param {Object} Object the diff should be applied to
 * @param {Object} The difference object(-tree)
 * @returns The Object passed as first argument with all differences applied.
 * @type {Object}
 */
jala.Object.prototype.applyDiff = function(obj, diff) {
   var propDiff, value1;
   for (var propName in diff) {
      propDiff = diff[propName];
      value1 = obj[propName];
      if (propDiff.status != null) {
         switch (propDiff.status) {
            case jala.Object.REMOVED:
               // app.debug("applyDiff(): removing property " + propName);
               delete obj[propName];
               break;
            case jala.Object.ADDED:
            case jala.Object.MODIFIED:
            default:
               // app.debug("applyDiff(): changing property " + propName + " to " + propDiff.value);
               obj[propName] = propDiff.value;
               break;
         }
      } else {
         // app.debug("applyDiff(): descending to child object " + propName);
         jala.object.applyDiff(value1, propDiff);
      }
   }
   return obj;
}

/**
 * Default Object class instance.
 * @type jala.Object
 * @final
 */
jala.object = new jala.Object();
