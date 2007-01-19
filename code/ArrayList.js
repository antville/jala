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
 * @fileoverview Fields and methods of the jala.ArrayList class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Creates a new ArrayList instance.
 * @class A simple wrapper around an array to use in conjunction
 * with jala.ListRenderer. This wrapper can either handle complete arrays
 * or subsections of an array. In the latter case the wrapper needs offset
 * and total size information as argument to mimick a complete array.
 * @param {Array} arr The array (or a subsection of an array) to wrap
 * @param {Number} offset An optional offset to use (mandatory if the array
 * is just a subsection).
 * @param {Number} total An optional total size of the array. This argument is mandatory
 * if the wrapped array is just a subsection.
 * @returns A newly created ArrayList instance
 * @constructor
 */
jala.ArrayList = function(arr, offset, total) {
   this.offset = offset || 0;
   this.length = total || arr.length;
   
   var isArraySubset = offset || total ? true : false;

   /**
    * Returns the element at the index position passed
    * as argument. If the wrapped array is just a subsection
    * the index position passed will be corrected using
    * the offset.
    * @param {Number} idx The index position of the element
    * to return
    * @returns The element at the given index position
    */
   this.get = function(idx) {
      return arr[(this.offset > 0) ? idx - offset : idx];
   };

   /**
    * Returns the size of this ArrayList, which is either
    * the length of the wrapped array or the total size
    * passed as argument to the constructor (in case the wrapped
    * array is just a subsection).
    * @returns The size of this ArrayList instance
    * @type Number
    */
   this.size = function() {
      return this.length;
   };
   
   /**
    * Returns true if this ArrayList is a subsection of a bigger array
    * @returns true or false. true if this ArrayList is a subsection of a bigger array
    */
   this.isSubset = function() {
      return isArraySubset;
   }
   
   /**
    * Returns the actual size of this ArrayList's wrapped array.
    * @returns the actual size of this ArrayList's wrapped array.
    */
   this.subsetSize = function() {
      return arr.length;
   }

   return this;
}
