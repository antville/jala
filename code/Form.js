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
app.addRepository("modules/jala/code/I18n.js");

/**
 * @class A class that renders and parses forms
 * @param {String} name Name of the form.
 * @constructor
 */
jala.Form = function(name) {

   /**
    * Readonly reference to the name of the form
    * @type String
    */
   this.name;     // for doc purposes only, readonly-access through the getter function
   this.__defineGetter__("name", function() {   return name;   });

   // The default component skin
   this.componentSkin = createSkin("<% param.error %><% param.label %><div class=\"element\"><% param.controls %><% param.help %></div>");

   // contains an Array of component-objects 
   var components = [];

   /**
    * Contains a map of component objects.
    */
   this.components = {};

   // tracks if any component uses a file upload (if so the render method will
   // use multipart/formdata as encoding type)
   var containsFileUpload = false;

   /**
    * Returns an array containing the components
    * of this jala.Form instance.
    * @returns The components of this jala.Form instance.
    * @type Array
    */
   this.listComponents = function() {
      return components;
   };

   /**
    * Adds a component to this jala.Form instance
    * @param {jala.InputComponent} component
    */
   this.addComponent = function(component) {
      component.setForm(this);
      components.push(component);
      this.components[component.name] = component;
      containsFileUpload |= component.constructor.containsFileUpload;
      return;
   };

   this.containsFileUpload = function() {
      return containsFileUpload;
   };


   // init private fields:
   var legend, submitCaption, errorMessage = undefined;

   /**
    * Returns the legend of the form.
    * @returns legend
    * @type String
    */
   this.getLegend = function() {
      return legend;
   };

   /**
    * Sets the legend text.
    * @param {String} newLegend legend to use when printing the form.
    */
   this.setLegend = function(newLegend) {
      legend = newLegend;
      return;
   };
   

   /**
    * Returns the caption of the submit button.
    * @returns caption
    * @type String
    */
   this.getSubmitCaption = function() {
      return submitCaption;
   };
   
   /**
    * Sets the caption of the submit button.
    * @param {String} newCaption
    */
   this.setSubmitCaption = function(newCaption) {
      submitCaption = newCaption;
      return;
   };


   /**
    * Returns the general error message printed above the form
    * if any of the components didn't validate.
    * @returns error message
    * @type String
    */
   this.getErrorMessage = function() {
      return errorMessage;
   };

   /**
    * Sets the general error message printed above the form if any
    * of the components didn't validate.
    * @param {String} newErrorMessage error message
    */
   this.setErrorMessage = function(newErrorMessage) {
      errorMessage = newErrorMessage;
      return;
   };



   var dataObj = {};

   /**
    * Sets the data object which is being edited by this form.
    * @param {Object} dataObj The object which is being edited by this form.
    */
   this.setDataObj = function(newDataObj) {
      dataObj = newDataObj;
      return;
   };

   /**
    * Returns the data object containing the values used
    * for rendering the form.
    * @returns The data object of this jala.Form instance
    */
   this.getDataObj = function() {
      return dataObj;
   };

   /**
    * Returns true if data object is a jala.Form.Tracker instance and at
    * at least one error has been set.
    * @returns true if an error has been encountered.
    * @type Boolean
    */
   this.hasError = function() {
      if (dataObj instanceof jala.Form.Tracker) {
         return dataObj.hasError();
      }
      return false;
   };

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
   return;
};


/**
 * Parses an object tree and configures a new jala.Form instance
 * according to the properties.
 * Propertynames are matched with setter-functions and
 * the property "class" is used to instanciate new
 * components.
 * @param {Object} config object tree containing config
 * @returns jala.Form instance
 * @type jala.Form
 */
jala.Form.parseConfig = function(config) {
   if (!config || !config.name || !config.elements) {
      return null;
   }
   var form = new jala.Form(config.name);
   if (config.legend) {
      form.setLegend(config.legend);
   }
   if (config.submitCaption) {
      form.setSubmitCaption(config.submitCaption);
   }
   if (config.errorMessage) {
      form.setErrorMessage(config.errorMessage);
   }
   for (var i=0; i<config.elements.length; i++) {
      element = config.elements[i];
      var constr = jala.Form[element["class"]];
      if (!constr) {
         continue;
      }
      var component = new constr(element.name);
      // call setter functions for all fields from config object:
      for (var key in element) {
         if (key == "name" || key == "class") {
            continue;
         }
         // note: String.prototype.titleize from the helma.core module
         // would uppercase the first letter, but lowercases all ensuing
         // characters (maxLength would become Maxlength).
         var func = component["set" + key.charAt(0).toUpperCase() + key.substring(1)];
         if (func) {
            func.apply(component, [element[key]]);
         }
      }
      form.addComponent(component);
   }   
   return form;
};


/**
 * Renders this form to the response.
 */
jala.Form.prototype.render = function() {

   // open the form tag
   var formAttr = {
      id     : this.name,
      name   : this.name,
      "class": "form",
      action : req.action,
      method : "post"
   };
   if (this.containsFileUpload()) {
      // if there is an upload element, use multipart-enctype
      formAttr.enctype = "multipart/form-data";
   }
   jala.Form.html.openTag("form", formAttr);

   // print optional general error message
   var errorMessage = this.getErrorMessage();
   if (this.hasError() && errorMessage) {
      jala.Form.html.element("div", errorMessage,
                   {id: this.createDomId("error"), "class": "form_error"});
   }

   jala.Form.html.openTag("fieldset");

   // optional legend
   if (this.getLegend() != null) {
      jala.Form.html.element("legend", this.getLegend());
   }

   // loop through elements
   var components  = this.listComponents();
   for (var i=0; i<components.length; i++) {
      components[i].render();
   }

   // submit button
   jala.Form.html.openTag("div");
   jala.Form.html.element("label", "", {id: this.createDomId("label", "submit")});
   jala.Form.html.submit({id: this.createDomId("submit"),
                name: this.createDomId("submit"),
                "class": "submit",
                "value": this.getSubmitCaption() || "Submit"});
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
   res.write(this.name);
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
 * Checks and validates user input from a submitted form.
 * First each component's checkSyntax method is called.
 * If it succeeds, the input is parsed and validated if
 * an optional validator function is set.
 * The tracker is stored as data object of the form.
 * @see #setValidator
 * @param {Object} reqData request data after a submit
 * @type jala.Form.Tracker
 */
jala.Form.prototype.check = function(reqData) {
   var tracker = new jala.Form.Tracker(reqData);
   var components = this.listComponents();
   for (var i=0; i<components.length; i++) {
      var name = components[i].name;
      var error = components[i].checkSyntax(reqData);
      if (error != null) {
         tracker.errors[name] = error;
      } else {
         tracker.values[name] = components[i].parseValue(reqData);
         if (components[i].getValidator()) {
            error = components[i].getValidator()(name, tracker.values[name], reqData, this);
            if (error != null) {
               tracker.errors[name] = error;
            }
         }
      }
   }
   this.setDataObj(tracker);
   return tracker;
};



/**
 * Sets the parsed values on an object, according to the 
 * according to the provisions made through setSetter.
 * @see #setSetter
 * @param {jala.Form.Tracker} tracker tracker object holding parsed
 *             data from form input.
 * @param {Object} destObj object whose values should be changed.
 */
jala.Form.prototype.save = function(tracker, destObj) {
   var components = this.listComponents();
   for (var i=0; i<components.length; i++) {
      components[i].setValue(destObj, tracker.values[components[i].name]);
   }
   return;
};




/**
 * Parses form input, applies check functions and stores the values
 * if the form does validate. Otherwise this method returns false
 * without saving so that the form can be reprinted with error messages.
 * @param {Object} reqData input from form
 * @param {Object} destObj object whose values should be chanegd
 * @returns False if one of the checks failed,
 *          true if the element was saved correctly.
 * @type Boolean
 */
jala.Form.prototype.handle = function(reqData, destObj) {
   var tracker = form.check(reqData);
   if (tracker.hasError()) {
      return false;
   } else {
      form.save(tracker, destObj);
      return true;
   }
};


/**
 * macro to render the form
 */
jala.Form.prototype.render_macro = function(param) {
   this.render(param);
   return;
};











/**
 * @class Class for rendering and validating input form elements.
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.InputComponent = function InputComponent(name) {

   /**
    * Readonly reference to name of component
    * @type String
    */
   this.name;     // for doc purposes only, readonly-access is through the getter function
   this.__defineGetter__("name", function() {   return name;   });

   
   /**
    * Readonly reference to instance of jala.Form.
    * @type jala.Form
    */
   this.form;     // for doc purposes only, readonly-access through the getter function
   this.__defineGetter__("form", function() {   return form;   });
   
   /**
    * Attaches this component to an instance of jala.Form.
    * @param {jala.Form} newForm form object
    * @private
    */
   this.setForm = function(newForm) {
      form = newForm;
      return;
   };


   this.getType = function() {
      return this.constructor.name.toLowerCase().replace(/component$/, "");
   };

   

   var className, label, help, required, getter, setter, validator = undefined;
   
   /**
    * Returns the class name set for this component.
    * @returns class name
    * @type String
    */
   this.getClassName = function() {
      return className;
   };

   /**
    * Sets an extra classname for this component
    * @param {String} newClassName new classname
    */
   this.setClassName = function(newClassName) {
      className = newClassName;
      return;
   };

   /**
    * Returns the label set for this component.
    * @returns label
    * @type String
    */
   this.getLabel = function() {
      return label;
   };

   /**
    * Sets the label for this component
    * @param {String} newLabel new label
    */
   this.setLabel = function(newLabel) {
      label = newLabel;
      return;
   };

   /**
    * Returns the help text set for this component.
    * @returns help text
    * @type String
    */
   this.getHelp = function() {
      return help;
   };

   /**
    * Sets the help text for this component
    * @param {String} newHelp new help text
    */
   this.setHelp = function(newHelp) {
      help = newHelp;
      return;
   };

   /**
    * Returns whether this component requires input
    * @returns true if component requires input
    * @type Boolean
    */
   this.getRequired = function() {
      return required;
   };

   /**
    * Sets the required status of this component
    * @param {Boolean} newRequired new required status
    */
   this.setRequired = function(newRequired) {
      required = newRequired;
      return;
   };

   /**
    * Returns a possible getter function for this component.
    * @returns getter function
    * @type Function
    */
   this.getGetter = function() {
      return getter;
   };

   /**
    * Sets the getter function for this component
    * @param {Function} newGetter new getter function
    */
   this.setGetter = function(newGetter) {
      getter = newGetter;
      return;
   };

   /**
    * Returns a possible setter function for this component.
    * @returns setter function
    * @type Function
    */
   this.getSetter = function() {
      return setter;
   };

   /**
    * Sets the setter function for this component. If set, the
    * function is called from the component's setValue-method
    * with three arguments and global scope:
    * <li>the object which is being handled by save method.
    * <li>name of the component
    * <li>new value to save
    * @see jala.Form.InputComponent#setValue
    * @param {Function} newSetter new setter function
    */
   this.setSetter = function(newSetter) {
      setter = newSetter;
      return;
   };

   /**
    * Returns the validator function for this component.
    * @returns validator function
    * @type Function
    */
   this.getValidator = function() {
      return validator;
   };

   /**
    * Sets the validator function for this component. If set, the
    * function is called from the check-method with four arguments:
    * <li>the name of the element
    * <li>the parsed value of the element if the user input is
    *     syntactically correct. For a date editor, the parsed value would
    *     be a date object.
    * <li>the map containing all user inputs as string (req.data)
    * <li>form object
    * @see #check
    * @param {Function} newValidator new validator function
    */
   this.setValidator = function(newValidator) {
      validator = newValidator;
      return;
   };
 
 
 
 
   var size, minLength, maxLength = undefined;

   /**
    * Returns the size set for this component.
    * @returns size
    * @type String
    */
   this.getSize = function() {
      return size;
   };

   /**
    * Sets the size of this input box
    * @param {String} newSize new size
    */
   this.setSize = function(newSize) {
      size = newSize;
      return;
   };


   /**
    * Returns the minimum length of this component.
    * @returns minimum length
    * @type String
    */
   this.getMinLength = function() {
      return minLength;
   };

   /**
    * Sets the minimum length of this input box
    * @param {String} newMinLength new minimum length
    */
   this.setMinLength = function(newMinLength) {
      minLength = newMinLength;
      return;
   };


   /**
    * Returns the maximum length of this component.
    * @returns maximum length
    * @type String
    */
   this.getMaxLength = function() {
      return maxLength;
   };

   /**
    * Sets the maximum length of this input box
    * @param {String} newMaxLength new maximum  length
    */
   this.setMaxLength = function(newMaxLength) {
      maxLength = newMaxLength;
      return;
   };
  
  
   var messages = {};
  
   /**
    * Returns a specific message for a config element.
    * @param {String} key The key of the message
    **               (e.g. "missing", "tooLong", "tooShort", "invalid").
    * @param {String} defaultMsg the message to use when no message was defined 
    *                in the config.
    * @param {Object} args One or more arguments passed to the gettext
    * message processor which will replace {0}, {1} etc.
    * @returns rendered message
    * @type String
    * @private
    */
   this.getMessage = function(key, defaultMsg, args) {
      var arr = [(messages[key]) ? messages[key] : defaultMsg];
      for (var i=2; i<arguments.length; i++) {
         arr.push(arguments[i]);
      }
      return gettext.apply(null, arr);
   };
  

   /**
    * Sets a custom error message
    */
   this.setMessage = function(key, msg) {
      messages[key] = msg;
      return;
   };
  
  
   return this;
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
jala.Form.InputComponent.prototype.getValue = function() {
   var dataObj = this.form.getDataObj();
   if (dataObj instanceof jala.Form.Tracker) {
      // handling re-rendering
      return null;
   } else if (this.getter instanceof Function) {
      return this.getGetter().apply(null, [dataObj, this.name]);
   } else {
      return dataObj[this.name];
   }
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
 * @see jala.Form#setSetter
 */
jala.Form.InputComponent.prototype.setValue = function(destObj, value) {
   // default value for the setter is undefined, so if it has been
   // set to explicitly null, we don't save the value. in this case,
   // we assume, the property is handled outside of jala.Form or purposely
   // ignored at all.
   var setter = this.getSetter();
   if (setter !== null) {
      if (setter instanceof Function) {
         setter.apply(null, [destObj, this.name, value]);
      } else {
         destObj[this.name] = value;
      }
   }
   return;
};



/**
 * Renders an element including label, error and help messages.
 */
jala.Form.InputComponent.prototype.render = function() {
   var className = (this.required == true) ? "required" : "optional";
   if (this.getClassName()) {
      className += " " + this.getClassName();
   }

   jala.Form.html.openTag("div",
      {id: this.form.name + "_row_" + this.name,
       "class": "row " + className
      }
   );

   renderSkin(this.form.componentSkin, this);

   jala.Form.html.closeTag("div");
   return;
};




/**
 * If the error tracker holds an error message for this element,
 * it is wrapped in a div-tag and returned as a string.
 * @returns Rendered string
 * @type String
 */
jala.Form.InputComponent.prototype.renderError = function() {
   var dataObj = this.form.getDataObj();
   if ((dataObj instanceof jala.Form.Tracker) && dataObj.errors[this.name]) {
      return jala.Form.html.elementAsString("div",
         dataObj.errors[this.name],
         {id: this.form.createDomId("error", this.name),
          "class": "error"});
   }
   return null;
};



/**
 * Wraps the Label for this element in a div-tag and returns it
 * as a string
 * @returns Rendered string
 * @type String
 */
jala.Form.InputComponent.prototype.renderLabel = function() {
   var name = this.name;
   return jala.Form.html.elementAsString(
      "label",
      this.getLabel() || "",
      {id: this.form.createDomId("label", name),
       "for": this.form.createDomId(name)
      }
   );
};



/**
 * If this element contains a help message, it is wrapped in
 * a div-tag and returned as a string.
 * @returns Rendered string
 * @type String
 */
jala.Form.InputComponent.prototype.renderHelp = function() {
   if (this.getHelp()) {
      return jala.Form.html.elementAsString(
         "div",
         this.getHelp(),
         {id: this.form.createDomId("help", this.name),
          "class": "help"
         }
      );
   }
   return null;
};


jala.Form.InputComponent.prototype.render_macro = function(param) {
   this.render();
};

jala.Form.InputComponent.prototype.controls_macro = function(param) {
   var attr = this.getControlAttributes();
   var dataObj = this.form.getDataObj();
   if (dataObj instanceof jala.Form.Tracker) {
      this.renderControls(attr, null, dataObj.reqData);
   } else {
      this.renderControls(attr, this.getValue());
   }
   return;
};

jala.Form.InputComponent.prototype.error_macro = function(param) {
   res.write(this.renderError());
   return;
};

jala.Form.InputComponent.prototype.label_macro = function(param) {
   res.write(this.renderLabel());
   return;
};

jala.Form.InputComponent.prototype.help_macro = function(param) {
   res.write(this.renderHelp());
   return;
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
      "class": this.getType() 
   };
   if (this.getClassName()) {
      attr["class"] += " " + this.getClassName();
   }
   return attr;
};



/**
 * Checks user input for maximum length, minimum length and required
 * if the corresponding options are set in this element's config.
 * @param {Object} reqData request data
 * @param {jala.Form.Tracker} tracker jala.Form.Tracker object storing possible error messages
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.InputComponent.prototype.checkLength = function(reqData) {
   var required  = this.getRequired();
   var minLength = this.getMinLength();
   var maxLength = this.getMaxLength();
   
   if (required && (reqData[this.name] == null || reqData[this.name].trim() == "")) {
      return this.getMessage("missing", "Please enter text into this field!");
   } else if (maxLength && reqData[this.name].length > maxLength) {
      return this.getMessage("tooLong", "Input for this field is too long ({0} characters). Please enter no more than {1} characters!",
                                 reqData[this.name].length, maxLength);
   } else if (minLength) {
      // set an error if the element is required but the input is too short
      // but don't throw an error if the element is optional and empty
      if (reqData[this.name].length < minLength &&
          (required || (!required && reqData[this.name].length > 0))) {
         return this.getMessage("tooShort", "Input for this field is too short ({0} characters). Please enter at least {1} characters!",
               reqData[this.name].length, minLength);
      }
   }
   return null;
};



/**
 * Validates user input from an input tag.
 * @see jala.Form.InputComponent#checkLength
 * @param {Object} reqData request data
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.InputComponent.prototype.checkSyntax = function(reqData) {
   return this.checkLength(reqData);
};


/**
 * Parses the string input from the form and creates the datatype that
 * can be edited with this component. E.g. a string should be converted
 * to a date object.
 * @param {Object} reqData request data
 * @returns parsed value
 * @type Object
 */
jala.Form.InputComponent.prototype.parseValue = function(reqData) {
   return reqData[this.name];
};


/**
 * Renders an input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.InputComponent.prototype.renderControls = function(attr, value, reqData) {
   attr.value = (reqData) ? reqData[this.name] : value;
   if (this.getMaxLength()) {
      attr.maxlength = this.getMaxLength();
   }
   if (this.getSize()) {
      attr.size = this.getSize();
   }
   jala.Form.html.input(attr);
   return;
};




/**
 * @class Subclass of jala.Form.InputComponent which renders plain text or skins.
 * @base jala.Form.InputComponent
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.SkinComponent = function SkinComponent(name) {
   jala.Form.SkinComponent.superConstructor.apply(this, arguments);
   
   var source = undefined;
   
   /**
    * Returns the skin source code for this component.
    * @returns skin source
    * @type String
    */
   this.getSource = function() {
      return source;
   };

   /**
    * Sets the skin source code for this component.
    * @param {String} newSource new skin source
    */
   this.setSource = function(newSource) {
      source = newSource;
      return;
   };

   
   
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.SkinComponent, jala.Form.InputComponent);

/**
 * Renders an input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.SkinComponent.prototype.renderControls = function(attr, value, reqData) {
   if (this.getSource()) {
      renderSkin(createSkin(this.getSource()));
   }      
   return;
};

/**
 * Not used in jala.Form.SkinComponent prototype.
 * @see jala.Form.InputComponent#checkLength
 * @param {Object} reqData request data
 * @param {jala.Form.Tracker} tracker jala.Form.Tracker object storing possible error messages
 * @returns null
 */
jala.Form.SkinComponent.prototype.checkSyntax = function(reqData) {
   return null;
};





/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * password input tag.
 * @base jala.Form.InputComponent
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.PasswordComponent = function PasswordComponent(name) {
   jala.Form.PasswordComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.PasswordComponent, jala.Form.InputComponent);


/**
 * Renders a password input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.PasswordComponent.prototype.renderControls = function(attr, value, reqData) {
   attr.value = (reqData) ? reqData[this.name] : value;
   if (this.getMaxLength()) {
      attr.maxlength = this.getMaxLength();
   }
   if (this.getSize()) {
      attr.size = this.getSize();
   }
   jala.Form.html.password(attr);
   return;
};



/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * textarea tag.
 * @base jala.Form.InputComponent
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.TextareaComponent = function TextareaComponent(name) {
   jala.Form.TextareaComponent.superConstructor.apply(this, arguments);

   var rows, cols = undefined;

   /**
    * Returns the row numbers for this component.
    * @returns row numbers
    * @type String
    */
   this.getRows = function() {
      return rows;
   };

   /**
    * Sets the row numbers for this component.
    * @param {String} newRows new row numbers
    */
   this.setRows = function(newRows) {
      rows = newRows;
      return;
   };

   /**
    * Returns the col numbers for this component.
    * @returns col numbers
    * @type String
    */
   this.getCols = function() {
      return cols;
   };

   /**
    * Sets the col numbers for this component.
    * @param {String} newCols new col numbers
    */
   this.setCols = function(newCols) {
      cols = newCols;
      return;
   };
   
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.TextareaComponent, jala.Form.InputComponent);

/**
 * Renders a textarea tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.TextareaComponent.prototype.renderControls = function(attr, value, reqData) {
   attr.value = (reqData) ? reqData[this.name] : value;
   if (this.getRows()) {
      attr.rows = this.getRows();
   }
   if (this.getCols()) {
      attr.cols = this.getCols();
   }
   jala.Form.html.textArea(attr);
   return;
};







/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * date editor.
 * @base jala.Form.InputComponent
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.DateComponent = function DateComponent(name) {
   jala.Form.DateComponent.superConstructor.apply(this, arguments);

   var dateFormat = "d.M.yyyy H:m";
   var dateFormatObj;

   /**
    * Returns the date format for this component.
    * @returns date format object
    * @type java.text.SimpleDateFormat
    */
   this.getDateFormat = function() {
      if (!dateFormatObj || dateFormatObj.toPattern() != dateFormat) {
         dateFormatObj = new java.text.SimpleDateFormat(dateFormat);
      }
      return dateFormatObj;
   };

   /**
    * Sets the date format for this component.
    * @param {String} newDateFormat new date format
    */
   this.setDateFormat = function(newDateFormat) {
      dateFormat = newDateFormat;
      return;
   };

   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.DateComponent, jala.Form.InputComponent);

/**
 * Renders a textarea tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.DateComponent.prototype.renderControls = function(attr, value, reqData) {
   attr.value = (reqData) ? reqData[this.name] : this.getDateFormat().format(value);
   if (this.getMaxLength()) {
      attr.maxlength = this.getMaxLength();
   }
   if (this.getSize()) {
      attr.size = this.getSize();
   }
   jala.Form.html.input(attr);
   return;
};


/**
 * Validates user input from a date editor.
 * @param {Object} reqData request data
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.DateComponent.prototype.checkSyntax = function(reqData) {
   try {
      this.parseValue(reqData);
      return null;
   } catch(e) {
      return this.getMessage("invalid", "This date cannot be parsed.");
   }
};


/**
 * Parses the string input from the form and converts it to a date object.
 * Throws an error if the string cannot be parsed.
 * @param {Object} reqData request data
 * @returns parsed date value
 * @type Date
 */
jala.Form.DateComponent.prototype.parseValue = function(reqData) {
   return this.getDateFormat().parse(reqData[this.name]);
};



/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * dropdown element.
 * @base jala.Form.InputComponent
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.SelectComponent = function SelectComponent(name) {
   jala.Form.SelectComponent.superConstructor.apply(this, arguments);
   
   var options, firstOption = undefined;
   
// * <li><code>options</code> An array of a function defining the options for this
// *      element. A function is called with the data object and the field name as 
// *      arguments and has to return an array.
// *      The array may contain arrays: <code>[  [val, display], [val, display] ]</code>,
// *      or objects: <code>[  {value:val, display:display}, ...]</code>,
// *      or strings whose value will be their index position.</li>
// * <li><code>firstOption</code> Text to display if no value is selected</li>


   this.getOptions = function() {
      return options;
   };
   
   this.setOptions = function(newOptions) {
      options = newOptions;
      return;
   };
   
   this.getFirstOption = function() {
      return firstOption;
   };
   
   this.setFirstOption = function(newFirstOption) {
      firstOption = newFirstOption;
      return;
   };
   
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.SelectComponent, jala.Form.InputComponent);

/**
 * Renders a dropdown element to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.SelectComponent.prototype.renderControls = function(attr, value, reqData) {
   value = (reqData) ? reqData[this.name] : value;
   jala.Form.html.dropDown(attr, this.parseOptions(), value, this.getFirstOption());
   return;
};

/**
 * Validates user input from a dropdown element and makes sure that
 * option value list contains the user input.
 * @see jala.Form.SelectComponent#checkOptions
 * @param {Object} reqData request data
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.SelectComponent.prototype.checkSyntax = function(reqData) {
   return this.checkOptions(reqData);
};

/**
 * Creates an array of options for a dropdown element or a
 * group of radiobuttons. If options field of this element's
 * config is an array, that array is returned.
 * If options is a function, its return value is returned.
 * @returns array of options
 * @type Array
 */
jala.Form.SelectComponent.prototype.parseOptions = function() {
   var options = this.getOptions();
   if (options != null) {
      if (options instanceof Array) {
         return options;
      } else if (options instanceof Function) {
         return options.apply(null, [this.form.getDataObj(), this.name]);
      }
   }
   return [];
};

/**
 * Checks user input for optiongroups: Value has to be in option array.
 * @param {Object} reqData request data
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.SelectComponent.prototype.checkOptions = function(reqData) {
   // if field is required, an empty option is not allowed:
   var found = (!this.getRequired() && !reqData[this.name]);
   if (!found) {
      var options = this.parseOptions();
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
      return "Please select a valid option!";
   }
   return null;
};




/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * set of radio buttons.
 * @base jala.Form.SelectComponent
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.RadioComponent = function RadioComponent(name) {
   jala.Form.RadioComponent.superConstructor.apply(this, arguments);
   return this;
};
// extend SelectComponent
jala.Form.extend(jala.Form.RadioComponent, jala.Form.SelectComponent);

/**
 * Renders a set of radio buttons to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.RadioComponent.prototype.renderControls = function(attr, value) {
   var options = this.parseOptions();
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
      res.write(optionDisplay);
      jala.Form.html.tag("br");
   }
   return;
};

/**
 * Validates user input from a set of radio buttons and makes sure that
 * option value list contains the user input.
 * @see jala.Form.SelectComponent#checkOptions
 * @param {Object} reqData request data
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.RadioComponent.prototype.checkSyntax = function(reqData) {
   return this.checkOptions(reqData);
};






/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * checkbox.
 * @base jala.Form.InputComponent
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.CheckboxComponent = function CheckboxComponent(name) {
   jala.Form.CheckboxComponent.superConstructor.apply(this, arguments);
   
   // FIXME: this component requires some work..
   
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.CheckboxComponent, jala.Form.InputComponent);

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
 * Parses the string input from the form.
 * @param {Object} reqData request data
 * @returns parsed value
 * @type Object
 */
jala.Form.CheckboxComponent.prototype.parseValue = function(reqData) {
   return reqData[this.name];
};


/**
 * Validates user input from checkbox. This method translates the "1" value
 * of the checkbox back into the checked/unchecked values defined by the
 * config.
 * @param {Object} reqData request data
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.CheckboxComponent.prototype.checkSyntax = function(reqData) {
   // FIXME: das sollte nach parseValue!!!!
   if (reqData[this.name] == "1") {
      reqData[this.name] = (this.checked) ? this.checked : "1";
   } else {
      reqData[this.name] = (this.unchecked) ? this.unchecked : "0";
   }
   return null;
};








/**
 * @class Subclass of jala.Form.InputComponent which renders and validates a
 * file upload. Note that the file is not saved. Use req.data[field].writeToFile(dir, name).
 * @base jala.Form.InputComponent
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.FileComponent = function FileComponent(name) {
   jala.Form.FileComponent.superConstructor.apply(this, arguments);
   
   var contentType, maxLength, validateImage = undefined;

   /**
    * Returns the mime types accepted as upload (string 
    * or array of strings)
    * @type String | Array
    */
   this.getContentType = function() {
      return contentType;
   };
   
   /**
    * Sets the mime types accepted as upload (string 
    * or array of strings)
    * @param {String | Array} newContentType
    */
   this.setContentType = function(newContentType) {
      contentType = newContentType;
      return;
   };
   
   /**
    * Returns the maximum length of uploaded files in bytes.
    * @type Number
    */
   this.getMaxLength = function() {
      return maxLength;
   };
   
   /**
    * Sets the maximum length of uploaded files
    * @param {Number} newMaxLength maximum length in bytes
    */
   this.setMaxLength = function(newMaxLength) {
      maxLength = newMaxLength;
      return;
   };
   
   /**
    * Returns true if uploaded data should be checked for an image.
    * @type Boolean
    */
   this.getValidateImage = function() {
      return validateImage;
   };
   
   /**
    * If set to true, Helma will try to create an image with
    * the uploaded data and print an error if this fails.
    * @param {Boolean} newValidateImage
    */
   this.setValidateImage = function(newValidateImage) {
      validateImage = newValidateImage;
      return;
   };
   
   return this;
};
// extend InputComponent
jala.Form.extend(jala.Form.FileComponent, jala.Form.InputComponent);

jala.Form.FileComponent.containsFileUpload = true;

/**
 * Renders a file input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.FileComponent.prototype.renderControls = function(attr, value, reqData) {
   var contentType = this.getContentType();
   if (contentType) {
      attr.accept = (contentType instanceof Array) ? contentType.join(",") : contentType;
   }
   jala.Form.html.file(attr);
   return;
};

/**
 * Validates a file upload by making sure it's there (if config.required is set),
 * checking the file size, the content type and by trying to construct an image.
 * @param {Object} reqData request data
 * @param {jala.Form.Tracker} tracker jala.Form.Tracker object storing possible error messages
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.FileComponent.prototype.checkSyntax = function(reqData) {

   if (reqData[this.name].contentLength == 0) {
      // no upload
      if (this.getRequired() == true) {
         return "File upload is required.";
      } else {
         // no further checks necessary, exit here
         return null;
      }
   }

   var maxLength = this.getMaxLength();
   if (maxLength && reqData[this.name].contentLength > maxLength) {
      return this.getMessage("tooLong", "This file is too big ({0} bytes), maximum allowed size {1} bytes.",
            reqData[this.name].contentLength, maxLength);
   }
   
   var contentType = this.getContentType();
   if (contentType) {
      var arr = (contentType instanceof Array) ? contentType : [contentType];
      if (arr.indexOf(reqData[this.name].contentType) == -1) {
         return this.getMessage("wrongType", "The file type {0} is not allowed.",
            reqData[this.name].contentType);
      }
   }
   
   if (this.getValidateImage()) {
      try {
         var helmaImg = new Image(reqData[this.name]);
      } catch (imgError) {
         return this.getMessage("invalid", "This image file can't be processed.");
      }
   }

   return null;
};









/**
 * static validator function to test values for being a valid email address.
 * @param {String} name name of the property being validated.
 * @param {String} value value in form input
 * @param {Object} reqData the whole request-data-object,
           in case properties depend on each other
 * @param {jala.Form} formObj instance of jala.Form
 * @returns Error message or null
 * @type String
 */
jala.Form.isEmail = function(name, value, reqData, formObj) {
   if (!value.isEmail()) {
      return "Please enter a valid email address!";
   }
   return null;
};

/**
 * static validator function to test values for being a valid url.
 * @param {String} name name of the property being validated.
 * @param {String} value value in form input
 * @param {Object} reqData the whole request-data-object,
           in case properties depend on each other
 * @param {jala.Form} formObj instance of jala.Form
 * @returns Error message or null
 * @type String
 */
jala.Form.isUrl = function(name, value, reqData, formObj) {
   if (value && !helma.Http.evalUrl(value)) {
      return "Please enter a valid URL (web address)!";
   }
   return null;
};



/**
 * A generic container for error-messages and values
 * @class Instances of this class can contain error-messages and values
 * @constructor
 * @type jala.Form.Tracker
 */
jala.Form.Tracker = function(reqData) {

   /**
    * A map containing input from request data
    * @type Object
    */
   this.reqData = reqData;

   /**
    * A map containing parsed values (only for those fields that didn't
    * fail during checkSyntax method).
    * @type Object
    */
   this.values = {};

   /**
    * A map containing error messages
    * @type Object
    */
   this.errors = {};

   return this;
};

/**
 * Returns true if an error has been set for at least one component.
 * @returns true if form encountered an error.
 * @type Boolean
 */
jala.Form.Tracker.prototype.hasError = function() {
   for (var keys in this.errors) {
      return true;
   }
   return false;
};

/**
 * Helper method.
 * @private
 */
jala.Form.Tracker.prototype.debug = function() {
   for (var key in this.errors) {
      res.debug(key + ":" + this.errors[key]);
   }
   return;
};



