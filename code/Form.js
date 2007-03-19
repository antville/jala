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
 * @fileoverview This class can be used to render forms and to validate
 *    and store user submits. Further types of form elements can be added
 *    by subclassing jala.Form.InputComponent.
 *
 * <p>Example code:</p>
 * <pre style="background-color: #eeeeee;">
========= Root.actions.js:
var form = res.handlers.testform = new jala.Form(this.FORMNAME, obj);
if (req.isPost() && form.handle(req.data, obj)) {
      // optional code after form was stored successfully
      // (like storing a new object, saving upload data)
      res.redirect(this.href("saved"));
}
this.renderSkin("main");

========= Root/main.skin:
<% testform.form %>


========= Root/formDef.js:

 this.FORMNAME = {

   name:"main",                  // name of the form (required)
   text: "message text"          // if set the message text will be rendered as skin (therefor it can contain macros)
   componentSkin: "skinName"     // render an external skin for each component of the form (the skin must be located in
                                 // the data object's prototype passed to the Form constructor!).
                                 // param object of the skin will contain these fields: label, error, help, control.
   title: "Einloggen",           // title of the form, printed as <legend></legend>
   submit: "Einloggen",          // caption of the submit button
   mainErrorMessage: "An error", // (optional) message printed above form in case of error
   beforeSave: "functionName",   // (optional) the name of the message to call before values are saved

   elements:[                    // array holding config for all the form elements

      {  name:"username",        // name of the form element
         type:"input",           // type of the element: input (default), textarea, password,
                                 //    radio, checkbox, dropdown, date, time, datetime, file, text
         label:"Nick",           // caption of the element
         size:20,                // size of input elements
         maxlength: 100,         // max allowed length
         minlength: 4,           // min allowed length
         className:"nickclass",  // optional classnames added to element
         required:true,          // if true, element has to be filled in (default false), an extra classname will be added.

         validate:[jala.Form.isUrl],  // function or array of functions called
                                 //    to specifically validate contents,
                                 //    function has four arguments:
                                 //       * name of the current element
                                 //       * value of the current element
                                 //       * jala.ErrorTracker object
                                 //       * reqData - the input from the form
         
         getter:function         // lets you specify a function which should retrieve the value of the property.
            (obj,name)  {        // the function is called with the data object as first and the name of the
         },                      // property as the second argument.
                                 // if omitted, the value of the primitive property at the data object
                                 // with the name of the form element is used.

         setter:function         // lets you specify a function which should save the value of the property.
            (obj, name, value) { // the function is called with the data object as first, the name as second
         },                      // and the new value as third argument.
                                 // if omitted, the value of the primitive property at the data object
                                 // with the name of the form element is used. if set explicitly to null
                                 // the value of the form is *not* saved (in this case you might want to
                                 // handle it in a "beforeSave" method).

         options: [...],         // for radio and dropdown, option-arrays are needed. they can be defined in 
                                 // the config directly or as a function (arguments: data object, name).
                                 // possible format of the array are:
                                 //    an array of objects {value:XX, display: YY}
                                 //    an array of arrays (1st element value, 2nd element display)
                                 //    or
                                 //    an array of strings (value and display)

         firstOption:" choooose" // caption of dropdown in case nothing is selected
         messages: {             // An object containing messages used in specific situations
            "missing":  msg      // A message displayed if the value is missing
            "tooLong":  msg      // A message used if the submitted value is too long
            "tooShort": msg      // A message used if the submitted value is too short
            "invalid":  msg      // A message used if the submitted value is invalid
         }
      },
   ]
};
</pre>
 <p>For further config options please refer to the overview of the specific class.</p>
 
 <p>With the default skin, the render function produces html-code structured like this:</p>
 <pre style="background-color: #eeeeee;">
&lt;form id="FORMNAME"&gt;
   &lt;legend&gt;optional title&lt;/legend&gt;
   &lt;div id="FORMNAME_error" class="form_error"&gt;general error message&lt;/div&gt;
   &lt;fieldset&gt;
      &lt;div id="FORMNAME_row_ELEMENTNAME" class="row optional|required CLASS_FROM_CONFIG"&gt;
         &lt;div id="FORMNAME_error_ELEMENTNAME" class="error"&gt;errormsg&lt;/div&gt;
         &lt;label id="FORMNAME_label_ELEMENTNAME" for="FORMNAME_ELEMENTNAME"&gt;label&lt;/label&gt;
         &lt;div class="element"&gt;
            &lt;input class="text|dropdown|etc CLASS_FROM_CONFIG" id="FORMNAME_ELEMENTNAME" /&gt;
            &lt;div id="FORMNAME_help_ELEMENTNAME" class="help"&gt;help&lt;/div&gt;
         &lt;/div&gt;
      &lt;/div&gt;
      (... repeat for all form elements ...)
      &lt;div&gt;
         &lt;label&gt;&lt;/label&gt;
         &lt;input type="submit" id="FORMNAME_submit" name="FORMNAME_submit" class="submit" /&gt;
      &lt;/div&gt;
   &lt;/fieldset&gt;
&lt;/form&gt;
 </pre>
 
 **/


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}

/**
 * core dependencies
 */
app.addRepository("modules/core/Object.js");
app.addRepository("modules/helma/Html.js");
app.addRepository("modules/helma/Http.js");

/**
 * Jala dependencies
 */
app.addRepository("modules/jala/code/ErrorTracker.js");
app.addRepository("modules/jala/code/I18n.js");
app.addRepository("modules/jala/code/Captcha.js");

/**
 * @class A class that renders and parses forms
 *
 * <p><b>Config options valid for jala.Form:</b><br/>
 * <li><code>name</code> Name of the form.</li>
 * <li><code>elements</code> Array of objects defining the form elements.</li>
 * <li><code>componentSkin</code> Name of skin located in the data object's prototype
 *      used to render form elements.</li>
 * <li><code>mainErrorMessage</code> Error message rendered ahead of the elements
 *      if any error occured while submitting the form.</li>
 * <li><code>beforeSave</code> Optional method at the store object called after
 *      the user input has validated but before the element is saved.</li>
 * <li><code>title</code> Title of the form, printed as legend.</li>
 * <li><code>submit</code> Value of submit button.</li>
 * </p>
 * @param {Object} config An object tree holding the layout of the form.
 * @param {Object} dataObj The object which is being edited by this form.
 *    For a commented example see at the end of this file
 * @constructor
 */
jala.Form = function(config, dataObj) {

   // check config
   if (!config) {
      throw "jala.Form created without config object.";
   }
   if (!config.name) {
      throw "jala.Form created without config.name property.";
   }
   if (!config.elements || !(config.elements instanceof Array)) {
      throw "jala.Form created without config.elements Array.";
   }

   // init private fields:
   
   // stores req.data if the form is handling a submit
   var reqData = null;

   // contains an Array of component-objects 
   // (initialization at the end of the constructor)
   var components = [];

   // keeps track of error messages
   var tracker = new jala.ErrorTracker(config.mainErrorMessage);

   // The default component skin
   this.componentSkin = createSkin("<% param.error %><% param.label %><div class=\"element\"><% param.controls %><% param.help %></div>");

   // Default message processor: gettext() from jala.I18n-package
   var messageProcessor = gettext;

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
   this.processMessage = function(/** args **/) {
      return messageProcessor.apply(null, arguments);
   };

   /**
    * Returns the config of this jala.Form instance.
    * @returns The config of this jala.Form instance.
    * @type Object
    */
   this.getConfig = function() {
      return config;
   };


   /**
    * Returns the components of this jala.Form instance.
    * @returns The components of this jala.Form instance.
    * @type Array
    */
   this.getComponents = function() {
      return components;
   };

   /**
    * Returns the tracker associated with this jala.Form instance.
    * @returns The tracker of this jala.Form instance.
    * @type jala.ErrorTracker
    */
   this.getTracker = function() {
      return tracker;
   };

   /**
    * Returns the data object containing the values used
    * for rendering the form.
    * @returns The data object of this jala.Form instance
    */
   this.getDataObj = function() {
      return dataObj || {};
   };


   /**
    * Stores the request-data object once the form was submitted.
    * Values will be used for re-printing the form if an error occurs.
    * @param {Object} newReqData Object holding request data.
    */
   this.setRequestData = function(newReqData) {
      reqData = newReqData;
   };

   /**
    * Returns the request-data object associated with this form.
    * @returns Object holding request data for this form.
    * @type Object
    */
   this.getRequestData = function() {
      return reqData;
   };


   // walk through the config and create the corresponding form element objects
   var element, type;
   for (var i=0; i<config.elements.length; i++) {
      element = config.elements[i];
      type = (element.type != null) ? element.type.toLowerCase() : "input";
      if (type == "input") {
         components[i] = new jala.Form.InputComponent(this, element);
      } else if (type == "password") {
         components[i] = new jala.Form.PasswordComponent(this, element);
      } else if (type == "textarea") {
         components[i] = new jala.Form.TextareaComponent(this, element);
      } else if (type == "select") {
         components[i] = new jala.Form.SelectComponent(this, element);
      } else if (type == "radio") {
         components[i] = new jala.Form.RadioComponent(this, element);
      } else if (type == "checkbox") {
         components[i] = new jala.Form.CheckboxComponent(this, element);
      } else if (type == "date") {
         components[i] = new jala.Form.DateComponent(this, element);
      } else if (type == "time") {
         components[i] = new jala.Form.TimeComponent(this, element);
      } else if (type == "timestamp") {
         components[i] = new jala.Form.TimestampComponent(this, element);
      } else if (type == "file") {
         components[i] = new jala.Form.FileComponent(this, element);
      } else if (type == "text") {
         components[i] = new jala.Form.TextComponent(this, element);
      } else if (type == "captcha") {
         components[i] = new jala.Form.CaptchaComponent(this, element);
      } else {
         throw "invalid config element at position " + i + ": " + element.type;
      }
   }

   return this;
};

/** @ignore */
jala.Form.prototype.toString = function() {
   return "[jala.Form]";
};

/**
 * The HTML renderer used by jala.Form
 * @type helma.Html
 */
jala.Form.html = new helma.Html();

/**
 * Utility to set up the prototype, constructor, superclass and superconstructor
 * properties to support an inheritance strategy that can chain constructors and methods.
 *
 * @param {Function} subClass the object which inherits superClass' functions
 * @param {Function} superClass the object to inherit
 */
jala.Form.extend = function(subClass, superClass) {
   var f = function() {};
   f.prototype = superClass.prototype;

   subClass.prototype = new f();
   subClass.prototype.constructor = subClass;
   subClass.superClass = superClass.prototype;
   subClass.superConstructor = superClass;
};

/**
 * @class Class for rendering and validating input form elements.

 * <p><b>Config options valid for all components:</b><br/>
 * <li><code>name</code> Name of the element in the form,
 *      name of the primitive property edited by this element.</li>
 * <li><code>type</code> Type of element to render: input (default), 
 *      password, textarea, dropdown, radio, checkbox, date, time
 *      datetime, file.</li>
 * <li><code>classname</code> Custom classname appended to the classname
 *      value computed by this class.</li>
 * <li><code>label</code> Label of form element.</li>
 * <li><code>help</code> Help text to show next to the form element.</li>
 * <li><code>getter</code> Optional function used to retrieve the value
 *      of a property.</li>
 * <li><code>setter</code> Optional function used to save the value.</li>
 * <li><code>messages</code> Optional object containing custom error messages
 *      for cases missing, invalid, tooLong, tooShort: {missing:"msgtext"}</li>
 * <li><code>validate</code> Optional function called to validate user input.</li>
 * <li><code>skin</code> Optional name of a skin located in the data object prototype
 *      used to render this form element.</li>
 * </p>
 * These options are copied as fields of the component object.
 * @constructor
 */
jala.Form.InputComponent = function(form, configObj) {
   if (form && configObj) {

      /**
       * Reference to form object
       * @type jala.Form
       */
      this.form = form;

      /**
       * Type of element as used in the config
       * @type String
       */
      this.type = configObj.type;

      /**
       * Optional getter function. Will be called by getProperty with these
       * arguments: getter(dataObj, name)
       * @type Function
       */
      this.getter = undefined;

      /**
       * Optional setter function. Will be called by setProperty with these
       * arguments: setter(dataObj, name, value)
       * @type Function
       */
      this.setter = undefined;

      /**
       * Optional validate function. Will be called by Form.handle with these
       * arguments: validate(name, value, tracker, reqData, form)
       * @type Function
       */ 
      this.validate = undefined;
      
      if (!configObj.name) {
         throw "no name given for form element " + configObj.type;
      }
      for (var key in configObj) {
         if (jala.Form.InputComponent.ACCEPTED_FIELDS_DEFAULT.indexOf(key) == -1 &&
             (this.constructor.ACCEPTED_FIELDS && this.constructor.ACCEPTED_FIELDS.indexOf(key) == -1)) {
            throw "error configuring element \"" + configObj.name + "\": \"" + key + "\" is not a valid config field";
         }
         this[key] = configObj[key];
      }
      if (this.validate && !(this.validate instanceof Function)) {
         throw "error configuring element \"" + this.name + "\": validate field may only contain a function or an array of functions";
      }
      return this;
   }
};


/**
 * An Array containing config field names that are valid for all components
 * @type Array
 */
jala.Form.InputComponent.ACCEPTED_FIELDS_DEFAULT = ["name", "type", "classname", "label", "help", "required", "getter", "setter", "messages", "validate", "skin"];


/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.InputComponent.ACCEPTED_FIELDS = ["size", "maxlength", "minlength"];



/**
 * Returns either a submitted form value or the value of the
 * data object in the form element
 * @returns Value of the element depending on the state of the form.
 * @type String Number Date
 */
jala.Form.InputComponent.prototype.getValue = function() {
   var reqData = this.form.getRequestData();
   if (reqData) {
      // value from failed form submit
      return reqData[this.name];
   } else {
      return this.getProperty();
   }
};



/**
 * Retrieves the property which is edited by this component.
 * <li>If no getter is given, the primitive property of the data object is returned.
 * <li>If a getter function is defined, it is executed and the return value used
 * as property. The data object and the name of the property are passed to the function
 * as arguments.</li>
 * @returns The value of the property
 * @type String Number Date
 * @final
 */
jala.Form.InputComponent.prototype.getProperty = function() {
   var obj = this.form.getDataObj();
   var result = null;
   if (this.getter instanceof Function) {
      result = this.getter.apply(null, [obj, this.name]);
   } else {
      result = obj[this.name];
   }
   return result;
};



/**
 * Sets a property of the object passed as argument to the given value.
 * <li>If no setter is given, the primitive property of the data object is changed.
 * <li>If a setter function is defined it is executed with the data object, name and
 * new value provided as arguments</li>
 * <li>If the setter is explicitly set to null, no changes are made at all.
 * @param {Object} value The value to set the property to
 * @returns True in case the update was successful, false otherwise.
 * @type Boolean
 * @final
 */
jala.Form.InputComponent.prototype.setProperty = function(value) {
   var obj = this.form.getDataObj();
   // only set the property if setter is not explicitly null,
   // otherwise we assume that the property is handled by a
   // "beforeSave" method or purposely ignored at all
   if (this.setter !== null) {
      if (this.setter instanceof Function) {
         this.setter.apply(null, [obj, this.name, value]);
      } else {
         obj[this.name] = value;
      }
   }
   return;
};



/**
 * Renders an element including label, error and help messages.
 */
jala.Form.InputComponent.prototype.render = function() {
   var param = {};
   param.error    = this.getError();
   param.label    = this.getLabel();
   param.help     = this.getHelp();

   res.push();
   this.renderControls(this.getControlAttributes(), this.getValue());
   param.controls = res.pop();

   var className = (this.required == true) ? "required" : "optional";
   if (this.className) {
      className += " " + configEl.className;
   }

   jala.Form.html.openTag("div", {id: this.form.getConfig().name + "_row_" + this.name,
                                  "class": "row " + className});
   if (this.skin) {
      this.form.getDataObj().renderSkin(this.skin, param);
   } else if (this.form.getConfig().componentSkin) {
      this.form.getDataObj().renderSkin(this.form.getConfig().componentSkin, param);
   } else {
      renderSkin(this.form.componentSkin, param);
   }
   jala.Form.html.closeTag("div");
   return;
};


/**
 * Renders an input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.InputComponent.prototype.renderControls = function(attr, value) {
   attr.value = value;
   if (this.maxlength) {
      attr.maxlength = this.maxlength;
   }
   if (this.size) {
      attr.size = this.size;
   }
   jala.Form.html.input(attr);
   return;
};



/**
 * If the error tracker holds an error message for this element,
 * it is wrapped in a div-tag and returned as a string.
 * @returns Rendered string
 * @type String
 */
jala.Form.InputComponent.prototype.getError = function() {
   var tracker = this.form.getTracker();
   if (tracker.errors[this.name]) {
      return jala.Form.html.elementAsString("div",
                                  this.form.processMessage(tracker.errors[this.name]),
                                  {id: this.form.createDomId("error", this.name),
                                   "class": "error"});
   }
   return;
};



/**
 * Wraps the Label for this element in a div-tag and returns it
 * as a string
 * @returns Rendered string
 * @type String
 */
jala.Form.InputComponent.prototype.getLabel = function() {
   return jala.Form.html.elementAsString("label",
                               this.form.processMessage(this.label || ""),
                               {id: this.form.createDomId("label", this.name),
                                "for": this.form.createDomId(this.name)});
};



/**
 * If this element contains a help message, it is wrapped in
 * a div-tag and returned as a string.
 * @returns Rendered string
 * @type String
 */
jala.Form.InputComponent.prototype.getHelp = function() {
   if (this.help) {
      return jala.Form.html.elementAsString("div",
                                  this.form.processMessage(this.help),
                                  {id: this.form.createDomId("help", this.name),
                                   "class": "help"});
   }
   return null;
};



/**
 * Creates a new attribute object for this element.
 * @returns Object with properties id, name, class
 * @type Object
 */
jala.Form.InputComponent.prototype.getControlAttributes = function() {
   var attr = {
      id: this.form.createDomId(this.name),
      name: this.name,
      "class": this.type 
   };
   if (this.className) {
      attr["class"] += " " + this.className;
   }
   return attr;
};



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
jala.Form.InputComponent.prototype.getMessage = function(key, defaultMsg) {
   if (this.messages && this.messages[key]) {
      return this.messages[key];
   } else {
      return defaultMsg;
   }
};



/**
 * Validates user input from an input tag.
 * @see jala.Form.InputComponent#checkLength
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.InputComponent.prototype.checkSyntax = function(reqData, tracker) {
   this.checkLength(reqData, tracker);
   return;
};




/**
 * Checks user input for maximum length, minimum length and required
 * if the corresponding options are set in this element's config.
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.InputComponent.prototype.checkLength = function(reqData, tracker) {
   if (this.required && (reqData[this.name] == null || reqData[this.name].trim() == "")) {
      tracker.setError(this.name,
                    this.form.processMessage(this.getMessage("missing", "Please enter text into this field!")));
   } else if (this.maxlength && reqData[this.name].length > this.maxlength) {
      tracker.setError(this.name, 
                    this.form.processMessage(this.getMessage("tooLong", "Input for this field is too long ({0} characters). Please enter no more than {1} characters!"),
                                 reqData[this.name].length, this.maxlength));
   } else if (this.minlength) {
      // set an error if the element is required but the input is too short
      // but don't throw an error if the element is optional and empty
      if (reqData[this.name].length < this.minlength &&
          (this.required || (!this.required && reqData[this.name].length > 0))) {
         tracker.setError(this.name,
               this.form.processMessage(this.getMessage("tooShort", "Input for this field is too short ({0} characters). Please enter at least {1} characters!"),
               reqData[this.name].length, this.minlength)
         );
      }
   }
   return;
};


/**
 * Saves the value of this component in the data object.
 * @param {Object} reqData request data
 */
jala.Form.InputComponent.prototype.setValue = function(reqData) {
   this.setProperty(reqData[this.name]);
   return;
};




/**
 * @class Subclass of jala.Form.InputComponent which renders plain text or skins.
 *
 * <p><b>Possible config options:</b><br/>
 * <li><code>text</code> String rendered as skin.</li>
 * </p>
 * @base jala.Form.InputComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.TextComponent = function(form, configObj) {
   jala.Form.TextComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.TextComponent, jala.Form.InputComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.TextComponent.ACCEPTED_FIELDS = ["text"];


/**
 * Renders an input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.TextComponent.prototype.renderControls = function(attr, value) {
   if (this.text) {
      renderSkin(createSkin(this.text));
   }      
   return;
};

/**
 * Not used in jala.Form.Text prototype.
 * @see jala.Form.InputComponent#checkLength
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.TextComponent.prototype.checkSyntax = function(reqData, tracker) {
   return;
};





/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * password input tag.
 * <p><b>Possible config options:</b><br/>
 * <li><code>size</code> Size attribute of the input tag.</li>
 * <li><code>maxlength</code> Maximum length of text.</li>
 * <li><code>minlength</code> Minimum length of text.</li>
 * </p>
 * @base jala.Form.InputComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.PasswordComponent = function(form, configObj) {
   jala.Form.PasswordComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.PasswordComponent, jala.Form.InputComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.PasswordComponent.ACCEPTED_FIELDS = ["size", "maxlength", "minlength"];


/**
 * Renders a password input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.PasswordComponent.prototype.renderControls = function(attr, value) {
   attr.value = value;
   if (this.maxlength) {
      attr.maxlength = this.maxlength;
   }
   if (this.size) {
      attr.size = this.size;
   }
   jala.Form.html.password(attr);
   return;
};



/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * textarea tag.
 * <p><b>Possible config options:</b><br/>
 * <li><code>rows</code> Rows attribute of the textarea.</li>
 * <li><code>cols</code> Cols attribute of the textarea.</li>
 * <li><code>maxlength</code> Maximum length of text.</li>
 * <li><code>minlength</code> Minimum length of text.</li>
 * </p>
 * @base jala.Form.InputComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.TextareaComponent = function TextareaComponent(form, configObj) {
   jala.Form.TextareaComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.TextareaComponent, jala.Form.InputComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.TextareaComponent.ACCEPTED_FIELDS = ["rows", "cols", "maxlength", "minlength"];

/**
 * Renders a textarea tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.TextareaComponent.prototype.renderControls = function(attr, value) {
   attr.value = value;
   if (this.rows) {
      attr.rows = this.rows;
   }
   if (this.cols) {
      attr.cols = this.cols;
   }
   jala.Form.html.textArea(attr);
   return;
};







/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * dropdown element.
 * <p><b>Possible config options:</b><br/>
 * <li><code>options</code> An array of a function defining the options for this
 *      element. A function is called with the data object and the field name as 
 *      arguments and has to return an array.
 *      The array may contain arrays: <code>[  [val, display], [val, display] ]</code>,
 *      or objects: <code>[  {value:val, display:display}, ...]</code>,
 *      or strings whose value will be their index position.</li>
 * <li><code>firstOption</code> Text to display if no value is selected</li>
 * </p>
 * @base jala.Form.InputComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.SelectComponent = function(form, configObj) {
   jala.Form.SelectComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.SelectComponent, jala.Form.InputComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.SelectComponent.ACCEPTED_FIELDS = ["options", "firstOption"];

/**
 * Renders a dropdown element to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.SelectComponent.prototype.renderControls = function(attr, value) {
   jala.Form.html.dropDown(attr, this.getOptions(), value,
                           this.form.processMessage(this.firstOption));
   return;
};

/**
 * Validates user input from a dropdown element and makes sure that
 * option value list contains the user input.
 * @see jala.Form.SelectComponent#checkOptions
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.SelectComponent.prototype.checkSyntax = function(reqData, tracker) {
   this.checkOptions(reqData, tracker);
   return;
};

/**
 * sCreate an array of options for a dropdown element or a
 * group of radiobuttons. If options field of this element's
 * config is an array, that array is returned.
 * If options is a function, its return value is returned.
 * @returns array of options
 * @type Array
 */
jala.Form.SelectComponent.prototype.getOptions = function() {
   if (this.options != null) {
      if (this.options instanceof Array) {
         return this.options;
      } else if (this.options instanceof Function) {
         return this.options.call(null, [this.form.getDataObj(), this.name]);
      }
   }
   return [];
};

/**
 * Checks user input for optiongroups: Value has to be in option array.
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.SelectComponent.prototype.checkOptions = function(reqData, tracker) {
   // if field is required, an empty option is not allowed:
   var found = (!this.required && !reqData[this.name]);
   if (!found) {
      var options = this.getOptions();
      var val = reqData[this.name];
      for (var i=0; i<options.length; i++) {
         if ((options[i] instanceof Array) && options[i].length > 0) {
            // option is an array (1st element = value, 2nd = display)
            if (options[i][0] == reqData[this.name]) {
               found = true;
               break;
            }
         } else if (options[i].value && options[i].display) {
            // option is an object with fields value + display
            if (options[i].value == reqData[this.name]) {
               found = true;
               break;
            }
         } else {
            // option is a string, value is index number
            if (i == reqData[this.name]) {
               found = true;
               break;
            }
         }
      }
   }
   if (!found) {
      tracker.setError(this.name, this.form.processMessage("Please select a valid option!"));
   }
   return;
};








/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * set of radio buttons.
 * <p><b>Possible config options:</b><br/>
 * <li><code>options</code> An array of a function defining the options for this
 *      element. A function is called with the data object and the field name as 
 *      arguments and has to return an array.
 *      The array may contain arrays: <code>[  [val, display], [val, display] ]</code>,
 *      or objects: <code>[  {value:val, display:display}, ...]</code>,
 *      or strings whose value will be their index position.</li>
 * </p>
 * @base jala.Form.SelectComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.RadioComponent = function(form, configObj) {
   jala.Form.RadioComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend SelectComponent
jala.Form.extend(jala.Form.RadioComponent, jala.Form.SelectComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.RadioComponent.ACCEPTED_FIELDS = ["options"];

/**
 * Renders a set of radio buttons to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.RadioComponent.prototype.renderControls = function(attr, value) {
   var options = this.getOptions();
   var optionAttr, optionDisplay;
   for (var i=0; i<options.length; i++) {
      optionAttr = attr.clone({}, false);
      optionAttr.id += "_" + i;
      if ((options[i] instanceof Array) && options[i].length > 0) {
         optionAttr.value = options[i][0];
         optionDisplay = options[i][1];
      } else if (options[i].value && options[i].display) {
         optionAttr.value = options[i].value;
         optionDisplay = options[i].display;
      } else {
         optionAttr.value = i;
         optionDisplay = options[i];
      }
      if (String(value) == String(optionAttr.value)) {
         optionAttr.checked = "checked";
      }
      jala.Form.html.radioButton(optionAttr);
      res.write(this.form.processMessage(optionDisplay));
      jala.Form.html.tag("br");
   }
   return;
};

/**
 * Validates user input from a set of radio buttons and makes sure that
 * option value list contains the user input.
 * @see jala.Form.SelectComponent#checkOptions
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.RadioComponent.prototype.checkSyntax = function(reqData, tracker) {
   this.checkOptions(reqData, tracker);
   return;
};






/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * checkbox.
 * <p><b>Possible config options:</b><br/>
 * <li><code>checked</code> Value to save if checkbox is checked.</li>
 * <li><code>unchecked</code> Value to save if checkbox is not checked.</li>
 * </p>
 * @base jala.Form.InputComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.CheckboxComponent = function(form, configObj) {
   jala.Form.CheckboxComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.CheckboxComponent, jala.Form.InputComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.CheckboxComponent.ACCEPTED_FIELDS = ["checked", "unchecked"];

/**
 * Renders an checkbox to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.CheckboxComponent.prototype.renderControls = function(attr, value) {
   if ((this.checked && value == this.checked) || value == "1") {
      attr.checked = "checked";
   }
   attr.value = "1";
   jala.Form.html.checkBox(attr);
   return;
};

/**
 * Validates user input from checkbox. This method translates the "1" value
 * of the checkbox back into the checked/unchecked values defined by the
 * config.
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.CheckboxComponent.prototype.checkSyntax = function(reqData, tracker) {
   if (reqData[this.name] == "1") {
      reqData[this.name] = (this.checked) ? this.checked : "1";
   } else {
      reqData[this.name] = (this.unchecked) ? this.unchecked : "0";
   }
   return;
};










/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * set of five or six dropdown boxes for editing date and time values.
 * <p><b>Possible config options:</b><br/>
 * <li><code>yearStart</code> First year in option list (current
 *          year by default).</li>
 * <li><code>yearEnd</code> Last year in option list (five years
 *          into the future by default)</li>
 * <li><code>seconds</code> If set to true, a dropdown for editing
 *          seconds will be rendered</li>
 * </p>
 * @base jala.Form.InputComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.TimestampComponent = function(form, configObj) {
   jala.Form.TimestampComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.TimestampComponent, jala.Form.InputComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.TimestampComponent.ACCEPTED_FIELDS = ["yearStart", "yearEnd", "seconds"];

/**
 * Overrides method of the same name in InputComponent.
 * This methods returns an object with properties year, month, date,#
 * hours, minutes, seoncds. The value is based on the user input if present,
 * otherwise the original date value is dissected.
 * @see jala.Form.InputComponent#getValue
 */
jala.Form.TimestampComponent.prototype.getValue = function() {
   var reqData = this.form.getRequestData();
   if (reqData) {
      // value from failed form submit
      return {
         year: reqData[this.name + "_year"],
         month: reqData[this.name + "_month"],
         date: reqData[this.name + "_date"],
         hours: reqData[this.name + "_hours"],
         minutes: reqData[this.name + "_minutes"],
         seconds: reqData[this.name + "_seconds"],
      };
   } else {
      var val = this.getProperty();
      return {
         year: val.getFullYear(),
         month: val.getMonth(),
         date: val.getDate(),
         hours: val.getHours(),
         minutes: val.getMinutes(),
         seconds: val.getSeconds()
      };
   }
   return;
};


/**
 * Overrides method of the same name in InputComponent.
 * This method first retrieves the original date value, updates the
 * original values with the relevant user input and calls
 * InputComponent.setProperty().
 * @see jala.Form.InputComponent#save
 */
jala.Form.TimestampComponent.prototype.setValue = function(reqData) {
   var val = this.getProperty();
   if (reqData[this.name + "_year"]) {
      val.setYear(reqData[this.name + "_year"]);
   }
   if (reqData[this.name + "_month"]) {
      val.setMonth(reqData[this.name + "_month"]);
   }
   if (reqData[this.name + "_date"]) {
      val.setDate(reqData[this.name + "_date"]);
   }
   if (reqData[this.name + "_hours"]) {
      val.setHours(reqData[this.name + "_hours"]);
   }
   if (reqData[this.name + "_minutes"]) {
      val.setMinutes(reqData[this.name + "_minutes"]);
   }
   if (reqData[this.name + "_seconds"]) {
      val.setSeconds(reqData[this.name + "_seconds"]);
   }
   this.setProperty(val);
   return;
};



/**
 * Helper function which parses config properties yearStart + yearEnd.
 * If they aren't present, default values are used (current year, five years from now).
 * @returns Object with properties start, end.
 * @type Object
 */
jala.Form.TimestampComponent.prototype.getYearClip = function() {
   var clip = {};
   var getit = function(field, prop, def) {
      if (prop && (prop instanceof Function)) {
         clip[field] = prop();
      } else if (prop) {
         clip[field] = parseInt(prop);
      } else {
         clip[field] = def;
      }
   }
   getit("start", this.yearStart, new Date().getFullYear());
   getit("end",   this.yearEnd,   (new Date().getFullYear() + 4));
   return clip;
};


/**
 * Renders a set of dropdown boxes to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.TimestampComponent.prototype.renderControls = function(attr, value) {
   this.renderDateControls(attr, value);
   this.renderTimeControls(attr, value);
   return;
};



/**
 * Renders dropdown boxes for day, month and year to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.TimestampComponent.prototype.renderDateControls = function(attr, value) {
   this.renderSelect(attr, "date", "Tag", 1, 31, value.date);
   this.renderMonthSelect(attr, "month", "Monat", value.month);
   var year = this.getYearClip();
   this.renderSelect(attr, "year", "Jahr", year.start, year.end, value.year);
   return;
};


/**
 * Renders dropdown boxes for hours, minutes and (if configured) seconds
 * to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.TimestampComponent.prototype.renderTimeControls = function(attr, value) {
   this.renderSelect(attr, "hours", null, 0, 23, value.hours);
   this.renderSelect(attr, "minutes", null, 0, 59, value.minutes);
   if (this.seconds == true) {
      this.renderSelect(attr, "seconds", null, 0, 59, value.seconds);
   }
   return;
};




/**
 * Validates user input from a set of date and time dropdown boxes
 * and makes sure that each value is within the valid range of options.
 * Further validation has to be done by custom functions!
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 * @see jala.Form.TimestampComponent#checkDate
 * @see jala.Form.TimestampComponent#checkTime
 */
jala.Form.TimestampComponent.prototype.checkSyntax = function(reqData, tracker) {
   this.checkTime(reqData, tracker);
   this.checkDate(reqData, tracker);
   return;
};


/**
 * Helper function to check user input from date dropdowns
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.TimestampComponent.prototype.checkDate = function(reqData, tracker) {
   var year = this.getYearClip();
   if (this.notInRange(reqData[this.name + "_year"], year.start, year.end)) {
      tracker.setError(this.name, this.form.processMessage("Input for 'year' is invalid."));
   }
   if (this.notInRange(reqData[this.name + "_month"], 0, 11)) {
      res.debug("monat ungültig");
      tracker.setError(this.name, this.form.processMessage("Input for 'month' is invalid."));
   }
   if (this.notInRange(reqData[this.name + "_date"], 1, 31)) {
      tracker.setError(this.name, this.form.processMessage("Input for 'day' is invalid."));
   }
   return;
};


/**
 * Helper function to check user input from time dropdowns
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.TimestampComponent.prototype.checkTime = function(reqData, tracker) {
   if (this.notInRange(reqData[this.name + "_hours"], 0, 23)) {
      tracker.setError(this.name, this.form.processMessage("Input for 'hour' is invalid."));
   }
   if (this.notInRange(reqData[this.name + "_minutes"], 0, 59)) {
      tracker.setError(this.name, this.form.processMessage("Input for 'minute' is invalid."));
   }
   if (this.seconds == true && this.notInRange(reqData[this.name + "_seconds"], 0, 59)) {
      tracker.setError(this.name, this.form.processMessage("Input for 'seconds' is invalid."));
   }
   return;
};



/**
 * Helper function for check methods. Checks that a value is set and within 
 * a given range.
 * @param {Object} value value to check
 * @param {Number} start miniumum value allowed
 * @param {Number} end maximum value allowed
 * @type Boolean
 * @returns true if value is within range, false otherwise.
 * @private
 */
jala.Form.TimestampComponent.prototype.notInRange = function(value, start, end) {
   return (!value || isNaN(value) || value < start || value > end);
};



/**
 * Helper function which renders a selectbox for choosing numbers.
 * @param {Object} attr
 * @param {String} suffix suffix to use for id and name values
 * @param {String} desc first element of select box
 * @param {Number} start where to start counting
 * @param {Number} end where to end counting
 * @param {Object} value current value of element
 * @private
 */
jala.Form.TimestampComponent.prototype.renderSelect = function(attr, suffix, desc, start, end, value) {
   var myAttr = attr.clone({}, false);
   myAttr.id += "_" + suffix;
   myAttr.name += "_" + suffix;
   var options = [];
   for (var i=start; i<=end; i++) {
      options.push([i, String(i)]);
   }
   if (desc) {
      desc = this.form.processMessage(desc);
   }
   if (isNaN(value)) {
      value = null;
   }
   jala.Form.html.dropDown(myAttr, options, value, desc);
   return;
};


/**
 * Helper function which renders a selectbox for choosing months.
 * @param {Object} attr
 * @param {String} suffix suffix to use for id and name values
 * @param {String} desc first element of select box
 * @param {Object} value current value of element
 * @private
 */
jala.Form.TimestampComponent.prototype.renderMonthSelect = function(attr, suffix, desc, value) {
   var myAttr = attr.clone({}, false);
   myAttr.id += "_" + suffix;
   myAttr.name += "_" + suffix;
   var options = [
      [0, this.form.processMessage("January")],
      [1, this.form.processMessage("February")],
      [2, this.form.processMessage("March")],
      [3, this.form.processMessage("April")],
      [4, this.form.processMessage("May")],
      [5, this.form.processMessage("June")],
      [6, this.form.processMessage("July")],
      [7, this.form.processMessage("August")],
      [8, this.form.processMessage("September")],
      [9, this.form.processMessage("October")],
      [10, this.form.processMessage("November")],
      [11, this.form.processMessage("December")]
   ];
   if (desc) {
      desc = this.form.processMessage("Monat");
   }
   if (isNaN(value)) {
      value = null;
   }
   jala.Form.html.dropDown(myAttr, options, value, desc);
   return;
};













/**
 * @class Subclass of jala.Form.TimestampComponent which renders and validates a
 * set of three dropdown boxes for editing date values.

 * <p><b>Possible config options:</b><br/>
 * <li><code>yearStart</code> First year in option list (current
 *          year by default).</li>
 * <li><code>yearEnd</code> Last year in option list (five years
 *          into the future by default)</li>
 * </p>
 * @base jala.Form.TimestampComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.DateComponent = function(form, configObj) {
   jala.Form.DateComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend TimestampComponent
jala.Form.extend(jala.Form.DateComponent, jala.Form.TimestampComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.DateComponent.ACCEPTED_FIELDS = ["yearStart", "yearEnd"];

/**
 * Renders a set of dropdown boxes to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.DateComponent.prototype.renderControls = function(attr, value) {
   this.renderDateControls(attr, value);
   return;
};

/**
 * Validates user input from a set of date dropdown boxes and makes sure that
 * each value is within the valid range of time options.
 * Further validation has to be done by custom functions!
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.DateComponent.prototype.checkSyntax = function(reqData, tracker) {
   this.checkDate(reqData, tracker);
   return;
};






/**
 * @class Subclass of jala.Form.TimestampComponent which renders and validates a
 * set of two or three dropdown boxes for editing time values.
 * <p><b>Possible config options:</b><br/>
 * <li><code>seconds</code> If set to true, a dropdown for editing
 *          seconds will be rendered</li>
 * </p>
 * @base jala.Form.TimestampComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.TimeComponent = function(form, configObj) {
   jala.Form.TimeComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend TimestampComponent
jala.Form.extend(jala.Form.TimeComponent, jala.Form.TimestampComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.TimeComponent.ACCEPTED_FIELDS = ["seconds"];

/**
 * Renders a set of dropdown boxes to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.TimeComponent.prototype.renderControls = function(attr, value) {
   this.renderTimeControls(attr, value);
   return;
};

/**
 * Validates user input from a set of time dropdown boxes and makes sure that
 * each value is within the valid range of time options.
 * Further validation has to be done by custom functions!
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.TimeComponent.prototype.checkSyntax = function(reqData, tracker) {
   this.checkTime(reqData, tracker);
   return;
};










/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * file upload. Note that the file is not saved. Use req.data[field].writeToFile(dir, name).
 * <p><b>Possible config options:</b><br/>
 * <li><code>required</code> If set to true, upload is mandatory for this form.
 * <li><code>contentType</code> Mime-Types accepted as upload
 *          (String or Array of Strings, no wildcards!)</li>
 * <li><code>maxlength</code> Maximum length of file in bytes</li>
 * <li><code>validateImage</code> If set to true, Helma will try to
 *          create an image with the uploaded data and print an
 *          error if this fails.</li>
 * </p>
 * @base jala.Form.InputComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.FileComponent = function(form, configObj) {
   jala.Form.FileComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.FileComponent, jala.Form.InputComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.FileComponent.ACCEPTED_FIELDS = ["contentType", "maxlength", "validateImage"];

/**
 * Renders a file input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.FileComponent.prototype.renderControls = function(attr, value) {
   if (this.contentType) {
      attr.accept = (this.contentType instanceof Array) ? this.contentType.join(",") : this.contentType;
   }
   jala.Form.html.file(attr);
   return;
};

/**
 * Validates a file upload by making sure it's there (if config.required is set),
 * checking the file size, the content type and by trying to construct an image.
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.FileComponent.prototype.checkSyntax = function(reqData, tracker) {

   if (reqData[this.name].contentLength == 0) {
      // no upload
      if (this.required == true) {
         tracker.setError(this.name, this.form.processMessage("File upload is required."));
         return false;
      } else {
         // no further checks necessary, exit here
         return true;
      }
   }

   if (this.maxlength && reqData[this.name].contentLength > this.maxlength) {
      tracker.setError(this.name, 
         this.form.processMessage(this.getMessage("tooLong", "This file is too big ({0} bytes), maximum allowed size {1} bytes."),
            reqData[this.name].contentLength, this.maxlength
         )
      );
      return false;
   }
   
   if (this.contentType) {
      var arr = (this.contentType instanceof Array) ? this.contentType : [this.contentType];
      if (arr.indexOf(reqData[this.name].contentType) == -1) {
         tracker.setError(this.name,
            this.form.processMessage(this.getMessage("invalid", "This file type is not allowed."))
         );
         return false;
      }
   }
   
   if (this.validateImage) {
      try {
         var helmaImg = new Image(reqData[this.name]);
      } catch (imgError) {
         tracker.setError(this.name, this.form.processMessage("This image file can't be processed."));
         return false;
      }
   }

   return true;
};








/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * captcha check.
 * <p><b>Possible config options:</b><br/>
 * <li><code>zero</code> To be done yet.
 * </p>
 * <h3>alpha code!!</h3>
 * @base jala.Form.InputComponent
 * @param {jala.Form} form The form this element belongs to.
 * @param {Object} configObj Object holding configuration data for this element.
 * @constructor
 */
jala.Form.CaptchaComponent = function(form, configObj) {
   jala.Form.CaptchaComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.CaptchaComponent, jala.Form.InputComponent);

/**
 * An Array containing the config field names that are valid for this component
 * @type Array
 */
jala.Form.CaptchaComponent.ACCEPTED_FIELDS = [];

/**
 * Renders a captcha image and input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.CaptchaComponent.prototype.renderControls = function(attr, value) {
   if (req.data.captcha == "image") {
      var cap = session.data["jala_ " + this.form.name + "_" + this.name + "_captcha"] = new jala.Captcha();
      res.reset();
      cap.renderImage();
      res.abort();
   }
   if (this.size) {
      attr.size = this.size;
   }
   jala.Form.html.tag("img", {id: attr.id + "_image", src:req.action + "?captcha=image&" + new Date().getTime(), width:150, height: 75, border:0});
   var newImgFunc = "function jala_newCaptcha_" + attr.id + "() { var img = new Image(); img.src = \"?captcha=image&\" + new Date().getTime(); document.getElementById(\"" + attr.id + "_image\").src = img.src; return false; } ";
   var newImgLink = "document.write('<br />" + this.form.processMessage("Can't read distored text?") + " <a href=\"#\" onclick=\"jala_newCaptcha_" + attr.id + "()\">" + this.form.processMessage("Change it!") + "</a>');";
   jala.Form.html.element("script", "<!--\n\n" + newImgFunc + "\n\n" + newImgLink + " //-->");
   jala.Form.html.tag("br");
   jala.Form.html.input(attr);
   return;
};

/**
 * Validates a captcha image
 * @param {Object} reqData request data
 * @param {jala.ErrorTracker} tracker jala.ErrorTracker object storing possible error messages
 */
jala.Form.CaptchaComponent.prototype.checkSyntax = function(reqData, tracker) {
   var cap = session.data["jala_ " + this.form.name + "_" + this.name + "_captcha"];
   if (!cap.validate(reqData[this.name])) {
      tracker.setError(this.name, this.form.processMessage("Distorted text has to be typed in this field!"));
      return false;
   }
   return true;
};













/**
 * Renders this form to the response.
 */
jala.Form.prototype.render = function() {
   var tracker = this.getTracker();
   var config = this.getConfig();
   var components  = this.getComponents();
   var dataObj = this.getDataObj();

   // open the form tag
   var formAttr = {
      id     : config.name,
      name   : config.name,
      "class": "form",
      action : req.action,
      method : "post"
   };
   
   // if there is an upload element, use multipart-enctype
   for (var i=0;i<components.length; i++) {
      if (components[i].type == "file") {
         formAttr.enctype = "multipart/form-data";
      }
   }
   jala.Form.html.openTag("form", formAttr);

   // optional general error message
   if (tracker && tracker.isError && tracker.mainErrorMessage) {
      jala.Form.html.element("div", this.processMessage(tracker.mainErrorMessage),
                   {id: this.createDomId("error"), "class": "form_error"});
   }

   jala.Form.html.openTag("fieldset");

   // optional title
   if (config.title != null) {
      jala.Form.html.element("legend", this.processMessage(config.title));
   }

   // loop through elements
   for (var i=0; i<components.length; i++) {
      components[i].render();
   }

   // submit button
   jala.Form.html.openTag("div");
   jala.Form.html.element("label", "", {id: this.createDomId("label", "submit")});
   jala.Form.html.submit({id: this.createDomId("submit"),
                name: this.createDomId("submit"),
                "class": "submit",
                "value": this.processMessage(config.submit || "Submit")});
   jala.Form.html.closeTag("div");
   jala.Form.html.closeTag("fieldset");
   jala.Form.html.closeTag("form");
   return;
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
 * parses form input, applies check functions and stores the values
 * @param {Object} reqData input from form
 * @param {Object} storeObj object to save data
 * @returns False if one of the checks failed,
 *          true if the element was saved correctly.
 * @type Boolean
 */
jala.Form.prototype.handle = function(reqData, storeObj) {
   if (arguments.length != 2) {
      throw "jala.Form.handle() called with insufficient arguments";
   }

   // store request data map. after this any further render functions
   // will use this object as source of their data
   this.setRequestData(reqData);

   var config     = this.getConfig();
   var components = this.getComponents();
   var tracker    = this.getTracker();

   for (var i=0; i<components.length; i++) {
      var name = components[i].name;

      // call check function of each component:
      components[i].checkSyntax(reqData, tracker);
      
      if (!tracker[name] && components[i].validate) {
         // call a custom check function from the config
         components[i].validate(name, reqData[name], tracker, reqData, this);
      }
   }

   if (tracker.isError) {
      // if any error occured, exit before saving:
      return false;
   }

   // call a possible beforeSave-function:
   if (config.beforeSave != null && storeObj[config.beforeSave] != null &&
             storeObj[config.beforeSave] instanceof Function) {
      // return with false if the beforeSave method returns false
      if (storeObj[config.beforeSave](formValues) == false) {
         tracker.setError(this.processMessage("The server has encountered technical problems and can't save your input. Please try again later!"));
         return false;
      }
   }

   for (var i=0; i<components.length; i++) {
      // call save method of each component:
      components[i].setValue(reqData);
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
      tracker.setError(name, gettext("Please enter a valid email address!"));
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
      tracker.setError(name, gettext("Please enter a valid URL (web address)!"));
   }
   return;
};
