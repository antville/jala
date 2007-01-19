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
 * @fileoverview Fields and methods of the Form class.
 * This library depends on ErrorTracker.js.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Jala dependencies
 */
app.addRepository("modules/jala/ErrorTracker.js");

/**
  * @class A class that renders and parses forms
  * @param {Object} config An object tree holding the layout of the form.
  * @param {Object} srcObj The object which is being edited by this form.
  *    For a commented example see at the end of this file
  * @constructor
  */
jala.Form = function(config, srcObj) {
   if (!config) {
      throw "Form created without config object.";
   }
   if (!config.name) {
      throw "Form created without config.name property.";
   }
   if (!config.elements) {
      throw "Form created without config.elements Array.";
   }

   // Default message processor. Use setMessageProcessor
   // to override it (eg. to use gettext() instead)
   var messageProcessor = function(msg) {
      return msg;
   }
   // keeps track of error messages
   var tracker = new jala.ErrorTracker(config.mainErrorMessage);

   // Use a plain JS object if no source object is given
   if (!srcObj) {
      srcObj = {};
   }

   /**
    * Sets the message processor to the function passed as argument.
    * @param {Function} functionObj The message processor function. It is
    * expected to accept a single argument (the message to process) and
    * to return the processed message.
    */
   this.setMessageProcessor = function(functionObj) {
      messageProcessor = functionObj;
      return;
   };

   /**
    * Process the message passed as argument by calling
    * the message processor. All arguments to this method
    * are directly passed to the message processor.
    * @param {String} msg The message to process
    * @returns The processed message
    * @type String
    */
   this.processMessage = function(msg /**[, arg][, arg][...] */) {
      return messageProcessor.apply(null, arguments);
   };

   /**
    * Returns the config of this Form instance.
    * @returns The config of this Form instance.
    * @type Object
    */
   this.getConfig = function() {
      return config;
   };

   /**
    * Returns the tracker associated with this Form instance.
    * @returns The tracker of this Form instance.
    * @type jala.ErrorTracker
    */
   this.getTracker = function() {
      return tracker;
   };

   /**
    * Returns the source object containing the values used
    * for rendering the form.
    * @returns The source object of this Form instance
    */
   this.getSource = function() {
      return srcObj || {};
   };

   return this;
}

/**
 * Renders this form directly to response.
 * @param {Object} param An optional parameter object containing macro attributes
 */
jala.Form.prototype.render = function(param) {
   var tracker = this.getTracker();
   var config = this.getConfig();
   var srcObj = this.getSource();

   // open the form tag
   Html.openTag("form", {
      id     : config.name,
      name   : config.name,
      "class": "form",
      action : req.action,
      method : "post"
   });

   if (tracker && tracker.isError && tracker.mainErrorMessage) {
      Html.element("div", this.processMessage(tracker.mainErrorMessage),
                   {id: this.createDomId("error"), "class": "form_error"});
   }

   Html.openTag("fieldset");
   if (config.title != null) {
      Html.element("legend", this.processMessage(config.title));
   }

   var configEl;
   for (var i=0; i<config.elements.length; i++) {
      configEl = config.elements[i];

      var className = (configEl.required == true) ? "required" : "optional";
      if (configEl.className) {
         className += " " + configEl.className;
      }
      Html.openTag("div", {id: config.name + "_row_" + configEl.name, "class": "row " + className});

      if (configEl.skin != null) {
         // render the skin specified in the context of the srcObj
         srcObj.renderSkin(configEl.skin);

      } else if (configEl.text != null) {
         // element contains only a text, so create a skin based on it and render
         Html.element("label", null);
         Html.element("div", renderSkinAsString(createSkin(configEl.text)), this.createElementAttributes(configEl));

      } else {
         // render the form element
         if (tracker && tracker.errors[configEl.name]) {
            Html.element("div", this.processMessage(tracker.errors[configEl.name]),
                         {id: this.createDomId("error", configEl.name),
                          "class": "error"});
         }

         Html.element("label", this.processMessage(configEl.label || ""),
                      {id: this.createDomId("label", configEl.name),
                       "for": this.createDomId(configEl.name)});
   
         Html.openTag("div", {"class":"element"});

         // use either a submitted form value or the value of the
         // source object in the form element
         var val;
         if (req.data[configEl.name] != null) {
            // value from failed form submit
            val = req.data[configEl.name];
         } else if (typeof(configEl.src) == "string") {
            if (resolved = Form.getProperty(srcObj, configEl.src)) {
               val = resolved.value;
            };
         } else {
            // no getter defined, so search for a primitive property
            // of the source object
            val = Form.getProperty(srcObj, configEl.getter, configEl.name);
         }
   
         // render the form element itself
         var attr = this.createElementAttributes(configEl);
         var options;
         switch (configEl.type) {
            case "select":
            case "dropdown":
               // Drop down select box
               Html.dropDown(attr, this.getOptions(configEl), val, this.processMessage(configEl.firstOption));
               break;
   
            case "radio":
               // A (set of) radio buttons
               var options = this.getOptions(configEl);
               var optionAttr;
               for (var j=0; j<options.length; j++) {
                  optionAttr = attr.clone({}, false);
                  optionAttr.id += "_" + j;
                  optionAttr.value = options[j].value;
                  if (String(val) == String(options[j].value)) {
                     optionAttr.checked = "checked";
                  }
                  Html.radioButton(optionAttr);
                  res.write(this.processMessage(options[j].display));
                  Html.tag("br");
               }
               break;
   
            case "checkbox":
               // Checkbox
               if (val == configEl.checked || req.data[configEl.name] == "1") {
                  attr.checked = "checked";
               }
               attr.value = "1";
               Html.checkBox(attr);
               break;
   
            case "textarea":
               // Textarea
               attr.value = val;
               delete attr.maxlength;
               Html.textArea(attr);
               break;
   
            case "password":
               // Password input field
               attr.value = val;
               Html.password(attr);
               break;
   
            default:
               // Text input field
               attr.value = val;
               Html.input(attr);
               break;
         }
   
         if (configEl.help) {
            Html.element("div", this.processMessage(configEl.help),
                         {id: this.createDomId("help", configEl.name),
                          "class": "help"});
            res.write("\n");
         }
   
         Html.closeTag("div");
      }
      Html.closeTag("div");
      res.write("\n\n");
   }
   Html.openTag("div");
   Html.element("label", "", {id: this.createDomId("label", "submit")});
   Html.submit({id: this.createDomId("submit"),
                name: this.createDomId("submit"),
                "class": "submit",
                "value": this.processMessage(config.submit || "Submit")});
   Html.closeTag("div");
   Html.closeTag("fieldset");
   Html.closeTag("form");
};

/**
 * renders the form as a string
 * @returns rendered form
 * @type String
 */
jala.Form.prototype.renderAsString = function(param) {
   res.push();
   this.render(param);
   return res.pop();
};

/**
 * Creates a DOM identifier based on the arguments passed. The
 * resulting Id will be prefixed with the name of the form config,
 * and all arguments will be separated by an underscore.
 * @returns The DOM Id
 * @type String
 */
jala.Form.prototype.createDomId = function(/* [part1][, part2][, ...] */) {
   res.push();
   res.write(this.getConfig().name);
   for (var i=0;i<arguments.length;i++) {
      if (arguments[i]) {
         if (i < arguments.length) {
            res.write("_");
         }
         res.write(arguments[i]);
      }
   }
   return res.pop();
};

/**
 * Creates a CSS class string based on the configuration element
 * passed as argument.
 * @param {Object} configEl The configuration element
 * @returns The CSS class string for this element
 */
jala.Form.prototype.createElementAttributes = function(configEl) {
   var attr = configEl.clone({}, false);
   attr.id = this.createDomId(configEl.name);
   attr["class"] = (configEl.type || "text");
   if (configEl.className) {
      attr["class"] += " " + configEl.className;
   }
   attr["name"] = configEl.name;
   delete attr.getter;
   delete attr.setter;
   delete attr.validate;
   delete attr.options;
   delete attr.firstOption;
   delete attr.label;
   delete attr.required;
   delete attr.className;
   delete attr.type;
   delete attr.text;
   delete attr.skin;
   delete attr.minlength;
   delete attr.help;
   return attr;
};

/**
  * create an array of options for a dropdown element or a
  * group of radiobuttons.
  * configEl.options is returned if that value is an Array.
  * If it's a Function, its return value is returned.
  * @param {Object} configEl a node from the config
  * @returns array of options
  * @type Array
  */
jala.Form.prototype.getOptions = function(configEl) {
   if (!configEl || !configEl.options) {
      return [];
   }
   if (configEl.options instanceof Array) {
      return configEl.options;
   }
   if (configEl.options instanceof Function) {
      return configEl.options.call(this.getSource());
   }
   return [];
};

/**
 * Retrieves a property from the object passed as argument. If a
 * path is given, this method follows the path down to the destination
 * property, which can either be a function or a primitive property.
 * For the former the method is called and the name argument is passed
 * to it, and the result value of this method is returned. For the former
 * this method directly returns the value of the primitive property.
 * @param {Object} obj The object to start with in case a path is given,
 * or the object whose property "name" should be returned
 * @param {String} path A dot-delimited path to the destination property
 * @param {String} name The name of the property to retrieve. In case the
 * path is given, and it leads to a getter-function, it is passed to this
 * method as the single argument.
 * @returns The value of the property
 * @final
 */
jala.Form.getProperty = function(obj, path, name) {
   var result = null;
   if (path != null) {
      var arr = path.split(".");
      var propName = arr.pop();
      if ((obj = Form.followPath(obj, arr)) != null) {
         if (obj[propName] != null && obj[propName] instanceof Function) {
            result = obj[propName](name);
         } else {
            result = obj[propName];
         }
      }
   } else {
      result = obj[name];
   }
   return result;
};

/**
 * Sets a property of the object passed as argument to the given value.
 * @param {Object} obj The object to start with in case a path is given,
 * or the object whose property "name" should be returned
 * @param {String} path A dot-delimited path to the destination property
 * @param {String} name The name of the property to retrieve. In case the
 * path is given, and it leads to a setter-function, it is passed to this
 * method as the first argument.
 * @param {Object} value The value to set the property to
 * @returns True in case the update was successful, false otherwise.
 * @type Boolean
 * @final
 */
jala.Form.setProperty = function(obj, path, name, value) {
   // app.logger.debug("Form.setProperty(): obj: " + obj + ", path: " + path + ", name: " + name);
   // use null value if value is an empty string
   if (value === "") {
      value = null;
   }
   if (path != null) {
      var arr = path.split(".");
      var propName = arr.pop();
      if ((obj = Form.followPath(obj, arr)) != null) {
         if (obj[propName] != null && obj[propName] instanceof Function) {
            obj[propName](name, value);
         } else {
            obj[propName] = value;
         }
      } else {
         return false;
      }
   } else {
      obj[name] = value;
   }
   return true;
};

/**
 * Helper method that follows a path array down, starting at the object
 * passed as argument.
 * @param {Object} obj The object to start at
 * @param {Array} pathArr The array containing path elements to follow
 * @returns The last object in the path, or null
 * @final
 */
jala.Form.followPath = function(obj, pathArr) {
   for (var i=0;i<pathArr.length;i++) {
      if ((obj = obj[pathArr[i]]) == null) {
         break;
      }
   }
   return obj;
};

/**
 * parses form input, applies check functions and stores the values
 * @param {Object} reqData input from form
 * @returns false if one of the checks failed,
 *          true if the element was saved correctly
 */
jala.Form.prototype.handle = function(reqData, storeObj) {
   /**
    * Returns a specific message for a config element.
    * @param {Object} configEl The config object containing a single element's metadata
    * @param {String} key The key of message (e.g. "missing", "toolong", "tooshort").
    * @param {String} defaultMsg the message to use when no message was defined 
    *        in the config.
    * @returns message
    * @type String
    * @private
    */
   var getMessage = function(configEl, key, defaultMsg) {
      if (configEl && configEl.messages && configEl.messages[key]) {
         return configEl.messages[key];
      } else {
         return defaultMsg;
      }
   };
   
   if (arguments.length != 2) {
      throw Error("Form.handle() called with insufficient arguments");
   }

   var config = this.getConfig();
   var tracker = this.getTracker();
   var formValues = {};

   // validate form elements
   var configEl;
   for (var i=0; i<config.elements.length; i++) {
      configEl = config.elements[i];

      // check required, max and min length:
      if (configEl.required && (reqData[configEl.name] == null || reqData[configEl.name].trim() == "")) {
         tracker.setError(configEl.name,
                       this.processMessage(getMessage(configEl, "missing", "Bitte füll dieses Textfeld aus.")));
      } else if (configEl.maxlength && reqData[configEl.name].length > configEl.maxlength) {
         tracker.setError(configEl.name, 
                       this.processMessage(getMessage(configEl, "tooLong", "Die Eingabe in diesem Textfeld ist zu lang ({0} Zeichen). Bitte gib höchstens {1} Zeichen ein."),
                                    reqData[configEl.name].length, configEl.maxlength));
      } else if (configEl.minlength) {
         // set an error if the element is required but the input is too short
         // but don't throw an error if the element is optional and empty
         if (reqData[configEl.name].length < configEl.minlength &&
             (configEl.required || (!configEl.required && reqData[configEl.name].length > 0))) {
            tracker.setError(configEl.name,
                  this.processMessage(getMessage(configEl, "tooShort", "Die Eingabe in diesem Textfeld ist zu kurz ({0} Zeichen). Bitte gib mindestens {1} Zeichen ein."),
                  reqData[configEl.name].length, configEl.minlength)
            );
         }
      }

      // for checkboxes, only 1 and empty are allowed
      if (configEl.type == "checkbox" && reqData[configEl.name] && reqData[configEl.name] != "1") {
         tracker.setError(configEl.name, this.processMessage("Bitte wähle einen gültigen Wert aus."));
      }

      // if option group, check that value is within options
      if (configEl.options) {
         var options = this.getOptions(configEl);
         var found = false;
         for (var j=0; j<options.length; j++) {
            if ( (options[j].length > 0 && options[j][0] == reqData[configEl.name]) ||
                 (!options[j].length && options[j].value == reqData[configEl.name]) ||
                 (options[j] == reqData[configEl.name]) ) {
               found = true;
               break;
            }
         }
         if (!found) {
            tracker.setError(configEl.name, this.processMessage("Bitte wähle einen gültigen Wert aus."));
         }
      }
      // run custom validation functions
      if (!tracker.errors[configEl.name] && configEl.validate) {
         if (configEl.validate instanceof Function) {
            configEl.validate(configEl.name, reqData[configEl.name], tracker, reqData, this);
         } else if (configEl.validate instanceof Array) {
            for (var j=0; j<configEl.validate.length; j++) {
               configEl.validate[j](configEl.name, reqData[configEl.name], tracker, reqData, this);
            }
         }
      }
      // store the form value in the data object
      formValues[configEl.name] = reqData[configEl.name];
   }

   if (tracker.isError) {
      return false;
   }

   // call a possible beforeSave-function:
   if (config.beforeSave != null && storeObj[config.beforeSave] != null &&
             storeObj[config.beforeSave] instanceof Function) {
      // return with false if the beforeSave method returns false
      if (storeObj[config.beforeSave](formValues) == false) {
         tracker.setError(this.processMessage("Ein unvorhergesehenes Problem ist aufgetreten. Bitte zu einem späteren Zeitpunkt wieder versuchen. "));
         return false;
      }
   }
   // store values in the storeObj
   var resolved;
   for (var i=0; i<config.elements.length; i++) {
      configEl = config.elements[i];
      var val = formValues[configEl.name];
      // translate checkbox values:
      if (configEl.type == "checkbox") {
         if (val == "1") {
            val = configEl.checked != null ? configEl.checked : 1;
         } else {
            val = configEl.unchecked != null ? configEl.unchecked : 0;
         }
      }
      if (configEl.setter !== null) {
         Form.setProperty(storeObj, configEl.setter, configEl.name, val);
      }
   }
   return true;
};

/**
  * macro to render the form
  */
jala.Form.prototype.form_macro = function(param) {
   this.render(param);
   return;
};


/**
  * static helper function to test values for being a valid email address.
  * @param {String} name name of the property being validated.
  * @param {String} value value in form input
  * @param {jala.ErrorTracker} tracker object holding error messages
  * @param {Object} reqData the whole request-data-object,
           in case properties depend on each other
  */
jala.Form.isEmail = function(name, value, tracker, reqData) {
   if (!value.isEmail()) {
      tracker.setError(name, gettext("Bitte gib eine gültige E-Mail-Adresse in das Textfeld ein."));
   }
   return;
};

/**
  * static helper function to test values for being a valid url.
  * @param {String} name name of the property being validated.
  * @param {String} value value in form input
  * @param {jala.ErrorTracker} tracker object holding error messages
  * @param {Object} reqData the whole request-data-object,
           in case properties depend on each other
  */
jala.Form.isUrl = function(name, value, tracker, reqData) {
   if (value && !helma.Http.evalUrl(value)) {
      tracker.setError(name, gettext("Bitte gib eine gültige URL (Web-Adresse) in das Textfeld ein."));
   }
   return;
};

/**
 
    Prototype.FORM_NAME = {

      name:"login",                 // name of the form (required)
      text: "message text"          // if set the message text will be rendered as skin (therefor it can contain macros)
      skin: "skinName"              // render an external skin at this position of the form (the skin must be located in
                                    // the srcObj prototype passed to the Form constructor!)
      title: "Einloggen",           // title of the form, printed as <legend></legend>
      submit: "Einloggen",          // caption of the submit button
      mainErrorMessage: "An error", // (optional) message printed above form in case of error
      beforeSave: "functionName",   // (optional) the name of the message to call before values are saved

      elements:[                    // array holding config for all the form elements

         {  name:"username",        // name of the form element
            type:"text",            // type of the element: text (default), textarea, password,
                                    //    radio, checkbox, dropdown
            label:"Nick",           // caption of the element
            size:20,                // size of input elements
            maxlength: 100,         // max allowed length
            minlength: 4,           // min allowed length
            className:"nickclass",  // optional classnames added to element
            required:true,          // if true, element has to be filled in (default false)
                                    //    this is reflected in class definition
            validate:[Form.isUrl],  // function or array of functions called
                                    //    to specifically validate contents,
                                    //    function has four arguments:
                                    //       * name of the current element
                                    //       * value of the current element
                                    //       * errortracker object
                                    //       * reqData - the input from the form
            getter:"user.name",     // lets you specify the name of a function or property where the value
                                    // to display in the form element should be retrieved. the name can
                                    // contain dots, in which case Form will follow the object path down
                                    // to the desired property/function. if a function is specified, the
                                    // single argument passed to it is the name of the form element
                                    // if omitted, the value of the primitive property at the data object
                                    // with the name of the form element is used.
            setter:"user.name",     // lets you specify the name of a function or property where the value
                                    // of the form should be saved. the name can
                                    // contain dots, in which case Form will follow the object path down
                                    // to the desired property/function. if a function is specified, the
                                    // name of the form element and the submitted value are passed to it.
                                    // if omitted, the value of the primitive property at the data object
                                    // with the name of the form element is used. if set explicitly to null
                                    // the value of the form is *not* saved (in this case you might want to
                                    // handle it in a "beforeSave" method
            options: [...],         // for radio and dropdown, option-arrays are needed. the format is either:
                                    //    an array of objects {value:XX, display: YY}
                                    //    an array of arrays (1st element value, 2nd element display)
                                    //    or
                                    //    an array of strings (value and display)
            firstOption:" choooose" // caption of dropdown in case nothing is selected
            messages: {             // An object containing messages used in specific situations
               "missing":  msg      // A message displayed if the value is missing
               "tooLong":  msg      // A message used if the submitted value is too long
               "tooShort": msg      // A message used if the submitted value is too short
            }
         },
      ]
   };
 
 
 
   the render function renders html-code like this:
   

   <form id="FORMNAME">
      <legend>formtitle</legend>
      <div id="FORMNAME_error" class="form_error">eventuelle allgemeine fehlermeldung</div>
   
      <fieldset>
   
         <div id="FORMNAME_row_ELEMENTNAME" class="row optional|required CLASS_FROM_CONFIG">
            <div id="FORMNAME_error_ELEMENTNAME" class="error">errormsg</div>
            <label id="FORMNAME_label_ELEMENTNAME" for="FORMNAME_ELEMENTNAME">desc</LABEL>
            <div class="element">
               <input class="text|dropdown|etc CLASS_FROM_CONFIG" id="FORMNAME_ELEMENTNAME">
               <div id="FORMNAME_help_ELEMENTNAME" class="help">helpmsg</div>
            </div>
         </div>
   
         (... repeat for all form elements ...)
   
         <div>
            <label></label>
            <input type="submit" id="FORMNAME_submit" name="FORMNAME_submit" class="submit" />
         </div>
   
      </fieldset>
</form>


**/
 