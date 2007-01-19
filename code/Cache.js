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
 * @fileoverview Fields and methods of the jala.Cache class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Constructs a new Cache instance.
 * @class Provides a Least-Recently-Used cache map
 * @param {Number} capacity The capacity of the cache
 * @constructor
 */
jala.Cache = function(capacity) {
   var size = capacity ? Math.floor(capacity / 2) : 1000;
   var newTable, oldTable;

   /**
    * Initializes the cache tables.
    */
   var init = function() {
      newTable = new java.util.Hashtable(size);
      oldTable = new java.util.Hashtable(size);
      return;
   }

   /**
    * Returns the accumulated size of both tables.
    * @returns The size of the cache.
    * @type Number
    */
   var getSize = function() {
      return newTable.size() + oldTable.size();
   }
   
   /**
    * Rotates the cache tables.
    */
   var rotate = function() {
      app.debug("jala.Cache: rotating cache tables at "
                + newTable.size() + "/" + oldTable.size());
      oldTable = newTable;
      newTable = new java.util.Hashtable(size);
      return;
   };

   /**
    * Adds an object to the cache using the key passed as argument.
    * @param {String} key The key to use for referencing the object.
    * @param {Object} value The value to store in the cache.
    * @returns The old value of the key, or null if it didn't have one.
    * @type Object
    */
   this.put = function(key, value) {
      var oldValue;
      if ((oldValue = newTable.put(key, value)) != null)
         return oldValue;
      if ((oldValue = oldTable.get(key)) != null)
         oldTable.remove(key);
      // we've put a new key into newTable, so rotate if necessary
      if (newTable.size() >= size) {
         rotate();
      }
      return oldValue;
   };
   
   /**
    * Returns the value associated with the key
    * passed as argument.
    * @param {Object} key The key to retrieve from the cache.
    * @returns The object found in the cache, or null.
    * @type Object
    */
   this.get = function(key) {
      var value;
      if ((value = newTable.get(key)) != null)
         return value;
      if ((value = oldTable.get(key)) != null) {
         // found the object in oldTable, so move it
         // into newTable
         newTable.put(key, oldTable.remove(key));
         return value;
      }
      return null;
   };

   /**
    * Removes the key from the cache.
    * @param {Object} key The key to remove from the cache.
    * @returns The value associtated to the key, or null.
    * @type Object
    */
   this.remove = function(key) {
      var oldValue;
      if ((oldValue = newTable.remove(key)) != null)
         return oldValue;
      return oldTable.remove(key);
   };

   /**
    * Returns true if the key passed as argument
    * exists in this cache.
    * @param {Object} key The key to search for in the cache.
    * @returns True if the key exists, false otherwise.
    * @type Boolean
    */
   this.containsKey = function(key) {
      return newTable.containsKey(key) || oldTable.containsKey(key);
   };
   
   /**
    * Returns true if the cache contains the value
    * passed as argument.
    * @param {Object} value The value to check for existance in the cache.
    * @returns True if the value exists, false otherwise.
    * @type Boolean
    */
   this.containsValue = function(value) {
      return newTable.containsValue(value) || oldTable.containsValue(value);
   }
   
   /**
    * Sets the cache capacity. This clears the
    * current cache!
    * @param {Number} capacity The new capacity of the cache.
    */
   this.setCapacity = function(capacity) {
      size = Math.floor(capacity / 2);
      oldTable = newTable;
      newTable = new java.util.Hashtable(size);
      return;
   };

   /**
    * Returns the nominal capacity of this cache instance.
    * @returns The maximum capacity of the cache.
    * @type Number
    */
   this.getCapacity = function() {
      return size * 2;
   };
   
   /**
    * Clears the complete cache by re-initializing it.
    */
   this.clear = function() {
      init();
      return;
   };

   /**
    * Returns true if the cache is empty
    */
   this.isEmpty = function() {
      return getSize() == 0;
   }
      
   /**
    * @ignore
    */
   this.toString = function() {
      return "[jala.Cache (capacity: " + capacity + ")]";
   };
   
   /** initialize the cache tables */
   init();
   return this;
};
