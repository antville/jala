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
 * @fileoverview Fields and methods of the jala.Logger class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Constructs a new Logger object
 * @class This class provides some convenience methods
 * for logging
 * @constructor
 */
jala.Logger = function() {

   /** @private */
   var constructMessage = function(msg, userName, reqPath) {
      res.push();
      res.write(">>> ");
      if (userName) {
         res.write("[")
         res.write(userName);
         res.write("] ");
      }
      if (msg)
         res.write(msg);
      if (reqPath) {
         res.write(" (path: ");
         res.write(reqPath);
         res.write(")");
      }
      res.write(" <<<");
      return res.pop();
   };

   /**
    * Writes the message passed as argument to application log
    * if the application is in debug mode.
    * FIXME: with recent Helma snapshots the req object also
    * exists for XmlRpc requests, so it shouldn't be necessary
    * anymore to pass the request path as argument, we could
    * simply use req.path instead.
    * @param {String} msg Message to write to log
    * @param {String} userName The name of the user that issued the request (optional)
    * @param {String} reqPath The request path (optional)
    */
   this.debug = function(msg, userName, reqPath) {
      app.debug(constructMessage(msg, userName, reqPath));
      return;
   };

   /**
    * Writes the message passed as argument to application log.
    * @param {String} msg Message to write to log
    * @param {String} userName The name of the user that issued the request (optional)
    * @param {String} reqPath The request path (optional)
    */
   this.log = function(msg, userName, reqPath) {
      app.log(constructMessage(msg, userName, reqPath));
      return;
   };

   /**
    * Writes an exception to application log. This method
    * accepts both Java exceptions and Javascript objects
    * thrown as Exception.
    * @param {Object} ex The exception object
    * @param {String} func The name of the function in which the exception was thrown (optional)
    * @param {String} userName The name of the user that issued the request (optional)
    * @param {String} reqPath The request path (optional)
    */
   this.logException = function(ex, funcName, userName, reqPath) {
      res.push();
      res.write("Exception");
      if (funcName) {
         res.write(" in ");
         res.write(funcName);
      }
      res.write(": ");
      if (ex.fileName || ex.lineNumber) {
         res.write(ex.message);
         res.write(" (");
         if (ex.fileName)
            res.write(ex.fileName);
         if (ex.lineNumber) {
            res.write(", line ");
            res.write(ex.lineNumber);
         }
         res.write(")");
      } else {
         res.write(ex.toString());
      }
      app.log(constructMessage(res.pop(), (userName ? userName : "system"), reqPath));
      return;
   };

   return this;
};


/** @ignore */
jala.Logger.toString = function() {
   return "[jala.Logger]";
};


/** @ignore */
jala.Logger.prototype.toString = function() {
   return "[jala.Logger Object]";
};


/**
 * Default logger class instance.
 * @type jala.Logger
 * @final
 */
jala.logger = new jala.Logger();
