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
 * @fileoverview Fields and methods of the jala.XmlPropertyManager class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Construct an XML-based property manager. 
 * @class This class can manage either XML-encoded properties 
 * of a HopObject or the XML source itself. For HopObjects 
 * this manager does an automatic update of the property after 
 * each call of set(), delete() or reset(). If instantiated 
 * with XML source the updated source string can be retrieved 
 * with getSource() or as HopObject with getContent().
 * @constructor
 * @param {Object} objOrXml A HopObject or an XML source string.
 * @param {String} propName Name of the property to manage.
 * @returns A new property manager.
 */
jala.XmlPropertyManager = function(objOrXml, propName) {
   var content, rawContent, isXml, error;

   var update = function() {
      rawContent = Xml.writeToString(content);
      if (!isXml)
         objOrXml[propName] = rawContent;
      return;
   };

   /**
    * Get an arbitrary property.
    * @param {String} key The name of the property.
    * @returns The value of the property.
    */
   this.get = function(key) {
      return content[key];
   };

   /**
    * Set an arbitrary property.
    * @param {String} key The name of the property.
    * @param {Object} value The value of the property.
    */
   this.set = function(key, value) {
      if (!key || !key.match(/^[a-z]/i))
         return false;
      content[key] = value;
      update();
      return;
   };

   /**
    * Delete a property.
    * @param {String} key The name of the property.
    * @returns False if the property could not be deleted.
    * @type Boolean
    */
   this["delete"] = function(key) {
      if (!key || !content[key])
         return false;
      delete content[key];
      update();
      return true;
   };

   /**
    * Get all available property names.
    * @returns The list of property names.
    * @type Array
    */
   this.keys = function() {
      var result = [];
      for (var i in content)
         result.push(i);
      return result;
   };

   /**
    * Reset the managed object to a void HopObject.
    */
   this.reset = function() {
      content = new HopObject();
      update();
      return;
   };

   /**
    * Get the object managed by this property manager.
    * @returns The managed object.
    * @type HopObject
    */
   this.getObject = function() {
      return content;
   };

   /**
    * Replaces the managed object with another one.
    * @param {HopObject} The new object to be managed.
    * @returns False if the object could not be replaced.
    * @type Boolean
    */
   this.setObject = function(obj) {
      if (!obj)
         return false;
      content = obj;
      update();
      return true;
   };

   /**
    * Get the XML source of the property manager.
    * @returns The XML source of the property manager.
    * @type String
    */
   this.getSource = function() {
      return Xml.writeToString(content);
   };

   /**
    * Get the last error that occurred.
    * @returns The last error that occured.
    * @type Exception
    */
   this.getError = function() {
      return error;
   };

   // constructor body

   if (objOrXml instanceof HopObject) {
      rawContent = objOrXml[propName];
      isXml = false;
   } else {
      rawContent = objOrXml;
      isXml = true;
   }
   try {
      content = rawContent ? Xml.readFromString(rawContent) : new HopObject();
   } catch (e) {
      error = e;
   }

   return this;
};
