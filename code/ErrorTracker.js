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
 * @fileoverview Fields and methods of the ErrorTracker class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * A generic (error-)message container
 * @class Instances of this class can contain a generic error- and non-error
 * message and any number of error- and confirm messages which can be embedded
 * in a skin using either the message or error macro.
 * @constructor
 * @param {String} a generic error message that can be rendered in a skin
 *        using the error macro without any "name" attribute
 * @returns A newly created FormFeedback instance
 * @type ErrorTracker
 */
jala.ErrorTracker = function(mainErrorMessage) {

   /**
    * Contains a generic error message that can be rendered in a skin
    * using the error macro without any "name" attribute
    * @type String
    */
   this.mainErrorMessage = mainErrorMessage;

   /**
    * A map containing error messages
    */
   this.errors = {};

   /**
    * A flag indicating that this instance contains error messages
    */
   this.isError = false;

   return this;
};

/**
 * Adds the message with the given name to the list of errors and
 * sets the isError flag to true. If only one argument is given, it
 * is interpreted as generic error message which can be rendered in
 * a skin using the error macro without any "name" attibute, otherwise
 * the message is stored with the given name argument as key.
 * @param {String} nameOrMessage Either the name of the error message
 * or a generic error message to use
 * @param {message} message The message to store under the key passed as first
 * argument
 */
jala.ErrorTracker.prototype.setError = function(nameOrMessage /** [, message] */) {
   if (arguments.length == 2) {
      this.errors[nameOrMessage] = arguments[1];
   } else if (nameOrMessage != null) {
      this.mainErrorMessage = nameOrMessage;
   }
   this.isError = true;
   return;
};

/**
 * Returns the error message with the given name. If the macro doesn't
 * contain a "name" attribute, the generic error message is returned,
 * otherwise the error message stored under the given name is returned.
 * If neither prefix nor suffix are set, the message is wrapped in a div-tag
 * of class 'error'.
 * @param {String} param.name name of message
 * @returns A previously stored error message
 * @type String
 */
jala.ErrorTracker.prototype.error_macro = function(param) {
   var str;
   if (!param.name && this.isError && this.mainErrorMessage) {
      str = this.mainErrorMessage;
   } else if (this.errors[param.name]) {
      str = this.errors[param.name];
   } else {
      return null;
   }
   return (!param.prefix && !param.suffix) ? '<div class="error">' + str + '</div>' : str;
};



/**
 * Dumps the content of this tracker using res.debug
 */
jala.ErrorTracker.prototype.debug = function() {
   if (this.mainErrorMessage) {
      res.debug(this.mainErrorMessage);
   }
   for (var key in this.errors) {
      res.debug(key + " = " + this.errors[key]);
   }
};
