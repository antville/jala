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
 *    and store user submits. Further types of form components can be added
 *    by subclassing jala.Form.Component.Input.
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
app.addRepository(getProperty(jala.dir, "modules/jala") + "/code/I18n.js");

/**
 * @class A class that renders and parses forms
 * @param {String} name Name of the form.
 * @param {Object} dataObj (optional) data object
 * @constructor
 */
jala.Form = function(name, dataObj) {

   /**
    * Readonly reference to the name of the form
    * @type String
    */
   this.name = name;     // for doc purposes only, readonly-access through the getter function
   this.__defineGetter__("name", function() {   return name;   });


   // by default use an empty javascript-object.
   if (!dataObj) {
      dataObj = {};
   }

   /**
    * Sets the data object which is being edited by this form. This object
    * is used to get the default values when first printing the form and 
    * - if no other object is provided - receives the changed values in save.
    * @param {Object} dataObj The object which is being edited by this form.
    * @see #save
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


   var tracker = undefined;
   
   /**
    * Sets the tracker object this form instance uses for collecting
    * error messages and parsed values.
    * @param {jala.Form.Tracker} newTracker
    */
   this.setTracker = function(newTracker) {
      if (newTracker instanceof jala.Form.Tracker){
         tracker = newTracker;
      }
      return;
   };

   /**
    * Returns the tracker object this form instance uses for collecting
    * error messages and parsed values.
    * @returns tracker object
    * @type jala.Form.Tracker
    */
   this.getTracker = function() {
      return tracker;
   };


   // The default component skin
   this.componentSkin = createSkin("<% param.error %><% param.label %><div class=\"element\"><% param.controls %><% param.help %></div>");

   // contains an Array of component-objects 
   var components = [];

   /**
    * Contains a map of component objects.
    * @type Object
    */
   this.components = {};

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
    * @param {jala.Form.Component.Input} component
    */
   this.addComponent = function(component) {
      component.setForm(this);
      components.push(component);
      this.components[component.name] = component;
      return;
   };

   /**
    * Returns true if this instance of jala.Form contains at least
    * one component doing a file upload.
    * @see jala.Form.Component#containsFileUpload
    * @type Boolean
    */
   this.containsFileUpload = function() {
      for (var i=0; i<components.length; i++) {
         if (components[i].containsFileUpload() == true) {
            return true;
         }
      }
      return false;
   };


   // init private fields:
   var submitCaption, errorMessage = undefined;

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

   /**
    * Returns true if this instance of jala.Form holds a jala.Form.Tracker
    * instance and at least one error has been set on this tracker.
    * @returns true if an error has been encountered.
    * @type Boolean
    */
   this.hasError = function() {
      if (tracker) {
         return tracker.hasError();
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
 * Parses a plain javascript object tree and configures a
 * new jala.Form instance according to the properties.
 * Propertynames are matched with constants and setter-functions,
 * the property "type" is used to create new component objects.
 * @param {Object} config object tree containing config
 * @returns jala.Form instance
 * @type jala.Form
 */
jala.Form.create = function(config) {
   if (!config || !config.name || !config.components) {
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
   if (config.components) {
      jala.Form.createComponents(form, config.components);
   }
   return form;
};


/**
 * Parses an array of plain js objects and tries to create components.
 * @param {jala.Form | jala.Form.Component.Fieldset} container
 *        Object whose addComponent method is used for adding new components.
 * @param {Array} arr Array of plain javascript objects used as config.
 * @private
 */
jala.Form.createComponents = function(container, arr) {
   var components = [];
   var element;
   for (var i=0; i<arr.length; i++) {
      element = arr[i];
      var clazzName = (element["type"]) ? element["type"].titleize() : "Input";
      var constr = jala.Form.Component[clazzName];
      if (!constr) {
         // invalid constructor
         var logStr = "jala.Form encountered unknown component type " + element["type"] + " in config of form ";
         logStr += (container.form) ? container.form.name : container.name;
         app.log(logStr);
         continue;
      }
      var component = new constr(element.name);
      container.addComponent(component);  // make sure that component.form is set before the loop!
      for (var key in element) {
         switch(key) {
            case "name":
            case "type":
            case "messages":
               break;
            case "components":
               jala.Form.createComponents(component, element[key]);
               break;
            case "getter":
            case "setter":
            case "validator":
               component[key] = element[key];
               break;
            case jala.Form.REQUIRED:
               component.require(key, true);
               break;
            default:
               // check if key matches a constant:
               if (jala.Form.CONSTANTS.indexOf(key.toLowerCase()) > -1) {
                  component.require(key.toLowerCase(), element[key]);
               } else {
                  // call setter functions for all fields from config object:
                  // note: String.prototype.titleize from the helma.core module
                  // would uppercase the first letter, but lowercases all ensuing
                  // characters (maxLength would become Maxlength).
                  // note: use try/catch to detect if the setter method really exists
                  // because a check using if(component[method]) would fail for
                  // inherited methods even though executing the inherited method works.
                  try {
                     component["set" + key.charAt(0).toUpperCase() + key.substring(1)](element[key]);
                  } catch (e) {
                     // invalid field for this component
                     app.log("jala.Form encountered unknown field " + key + " in config of form " + component.form.name);
                  }
               }
               break;
         }
      }
      if (element.messages) {
         for (var key in element.messages) {
            component.setMessage(key, element.messages[key]);
         }
      }
   }
   return;
};


/**
 * Renders the opening form tag
 * @private
 */
jala.Form.prototype.renderFormOpen = function() {
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
};



/**
 * Renders this form to the response.
 */
jala.Form.prototype.render = function() {

   this.renderFormOpen();

   // print optional general error message
   var errorMessage = this.getErrorMessage();
   if (this.hasError() && errorMessage) {
      jala.Form.html.element("div", errorMessage,
                   {id: this.createDomId("error"), "class": "form_error"});
   }

   // loop through elements
   var components  = this.listComponents();
   for (var i=0; i<components.length; i++) {
      components[i].render();
   }

   // submit button
   jala.Form.html.openTag("div");
   jala.Form.html.element("label", "", {id: this.createDomId("submit", "label")});
   jala.Form.html.submit({id: this.createDomId("submit"),
                name: this.createDomId("submit"),
                "class": "submit",
                "value": this.getSubmitCaption() || "Submit"});
   jala.Form.html.closeTag("div");
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
 * Validates user input from a submitted form by calling each
 * component's validate method.
 * @param {Object} reqData request data after a submit
 * @returns tracker object with error fields set.
 * @type jala.Form.Tracker
 */
jala.Form.prototype.validate = function(reqData) {
   var tracker = new jala.Form.Tracker(reqData);
   var components = this.listComponents();
   for (var i=0; i<components.length; i++) {
      components[i].validate(tracker);
   }
   this.setTracker(tracker);
   return tracker;
};



/**
 * Sets the parsed values on an object. By default the internally 
 * stored tracker and data objects are used, but those may be 
 * overridden here.
 * @param {jala.Form.Tracker} tracker (optional) tracker object
 *       holding parsed data from form input.
 * @param {Object} destObj (optional) object whose values will be changed.
 *       By default the dataObj passed to the constructor or to
 *       setDataObj is used.
 */
jala.Form.prototype.save = function(tracker, destObj) {
   tracker = (tracker) ? tracker : this.getTracker();
   destObj = (destObj) ? destObj : this.getDataObj();
   var components = this.listComponents();
   for (var i=0; i<components.length; i++) {
      components[i].save(tracker, destObj);
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
   var tracker = form.validate(reqData);
   if (tracker.hasError()) {
      return false;
   } else {
      form.save(tracker, destObj);
      return true;
   }
};


/**
 * Macro to render the form
 */
jala.Form.prototype.render_macro = function(param) {
   this.render(param);
   return;
};

/**
 * Macro to print the id (equal to the name) of the form
 */
jala.Form.prototype.id_macro = function(param) {
   res.write(this.name);
}

/**
 * Macro to print the opening form tag
 */
jala.Form.prototype.formOpen_macro = function(param) {
   this.renderFormOpen();
};

/**
 * Macro to print the closing form tag
 */
jala.Form.prototype.formClose_macro = function(param) {
   jala.Form.html.closeTag("form");
};

/**
 * Constant used by require function to define that a component
 * should not validate if userinput is shorter than a given length.
 * Value: "minlength"
 * @type String
 */
jala.Form.MINLENGTH     = "minlength";

/**
 * Constant used by require function to define that a component
 * should not validate if userinput exceeds a maximum length.
 * Value: "maxlength"
 * @type String
 */
jala.Form.MAXLENGTH     = "maxlength";

/**
 * Constant used by require function to define that a component
 * should validate only if the user did provide input.
 * Value: "required"
 * @type String
 */
jala.Form.REQUIRED      = "required";

/**
 * Constant used by require function to define that a select or
 * radio component should validate only if the user input is contained
 * in the list of options provided.
 * Value: "checkoptions"
 * @type String
 */
jala.Form.CHECKOPTIONS  = "checkoptions";

/**
 * Constant used by require function to define that a file upload
 * component should validate only if the file's content type is
 * in the list of allowed content types provided.
 * Value: "contenttype"
 * @type String
 */
jala.Form.CONTENTTYPE   = "contenttype"; 

/**
 * Constant used by require function to define that an image upload
 * component should validate only if the image's width is less than
 * the value provided.
 * Value: "maxwidth"
 * @type String
 */
jala.Form.MAXWIDTH      = "maxwidth";

/**
 * Constant used by require function to define that an image upload
 * component should validate only if the image's width is more than
 * the value provided.
 * Value: "minwidth"
 * @type String
 */
jala.Form.MINWIDTH      = "minwidth";

/**
 * Constant used by require function to define that an image upload
 * component should validate only if the image's height is less than
 * the value provided.
 * Value: "maxheight"
 * @type String
 */
jala.Form.MAXHEIGHT     = "maxheight";

/**
 * Constant used by require function to define that an image upload
 * component should validate only if the image's height is more than
 * the value provided.
 * Value: "min-height"
 * @type String
 */
jala.Form.MINHEIGHT     = "minheight";

// collect constants in an array
jala.Form.CONSTANTS = [];
for (var key in jala.Form) {
   if (key.toLowerCase() == jala.Form[key]) {
      jala.Form.CONSTANTS.push(jala.Form[key]);
   }
}


/**
 * The abstract base class for all components.
 * @constructor
 */
jala.Form.Component = function Component(name) {
   /**
    * The Form this component belongs to
    * @type jala.Form
    * @private
    */
   var form;

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

   /**
    * Returns the type of component. This is the lowercase'd name of the
    * constructor function.
    * @type String
    */
   this.getType = function() {
      return this.constructor.name.toLowerCase();
   };

   /**
    * Function defining wheter a component contains a file upload or not.
    * This value is used to render a form tag with the attribute
    * enctype=multipart/form-data.
    * Subclasses of jala.Form.Component that use a file upload element,
    * have to override this function and let it return true.
    * @type Boolean
    */
   this.containsFileUpload = function() {
      return false;
   };

};

/**
 * Function to render a component.
 * Subclasses of jala.Form.Component may override this function.
 */
jala.Form.Component.prototype.render = function() {
};


/**
 * Function to validate a component.
 * Subclasses of jala.Form.Component may override this function.
 * @param {jala.Form.Tracker} tracker object tracking errors and holding
 *    parsed values and request data.
 */
jala.Form.Component.prototype.validate = function(tracker) {
};


/**
 * Function to save the data of a component.
 * Subclasses of jala.Form.Component may override this function.
 */
jala.Form.Component.prototype.save = function(destObj, val) {
};





jala.Form.Component.Fieldset = function Fieldset(name) {
   jala.Form.Component.Fieldset.superConstructor.apply(this, arguments);
   
   // contains an Array of component-objects 
   var components = [];

   /**
    * Contains a map of component objects.
    */
   this.components = {};

   /**
    * Returns an array containing the components
    * of this jala.Form.Component.Fieldset instance.
    * @returns The components of this jala.Form instance.
    * @type Array
    */
   this.listComponents = function() {
      return components;
   };

   /**
    * Adds a component to this jala.Form.Component.Fieldset instance
    * @param {jala.Form.Component.Input} component
    */
   this.addComponent = function(component) {
      component.setForm(this.form);
      components.push(component);
      this.components[component.name] = component;
      return;
   };

   /**
    * Returns true if this instance of jala.Form.Component.Fieldset
    * contains at least one component doing a file upload.
    * @see jala.Form.Component#containsFileUpload
    * @type Boolean
    */
   this.containsFileUpload = function() {
      for (var i=0; i<components.length; i++) {
         if (components[i].containsFileUpload() == true) {
            return true;
         }
      }
      return false;
   };

   // init private field:
   var legend = undefined;

   /**
    * Returns the legend of the fieldset.
    * @returns legend
    * @type String
    */
   this.getLegend = function() {
      return legend;
   };

   /**
    * Sets the legend text.
    * @param {String} newLegend legend to use when printing the fieldset.
    */
   this.setLegend = function(newLegend) {
      legend = newLegend;
      return;
   };

};
// extend jala.Form.Component
jala.Form.extend(jala.Form.Component.Fieldset, jala.Form.Component);



/**
 * Renders all components within the fieldset.
 */
jala.Form.Component.Fieldset.prototype.render = function() {
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

   jala.Form.html.closeTag("fieldset");   
   return;
};


/**
 * Validates all components within the fieldset.
 * @param {jala.Form.Tracker} tracker
 */
jala.Form.Component.Fieldset.prototype.validate = function(tracker) {
   var components  = this.listComponents();
   for (var i=0; i<components.length; i++) {
      components[i].validate(tracker);
   }
   return;
};


/**
 * Saves all components within the fieldset.
 * @param {jala.Form.Tracker} tracker
 * @param {Object} destObj
 */
jala.Form.Component.Fieldset.prototype.save = function(tracker, destObj) {
   var components  = this.listComponents();
   for (var i=0; i<components.length; i++) {
      components[i].save(tracker, destObj);
   }
   return;
};






/**
 * @class Subclass of jala.Form.Component which renders a skin.
 * @base jala.Form.Component
 * @param {String} name Name of the component, used as name of the skin
 * @constructor
 */
jala.Form.Component.Skin = function Skin(name) {
   jala.Form.Component.Skin.superConstructor.apply(this, arguments);
   
   var handler = undefined;
   
   /**
    * Returns the handler object for the skin.
    * @type Object
    */
   this.getHandler = function() {
      return handler;
   };

   /**
    * Sets the handler to use when rendering the skin.
    * By default, the form's data object is used a handler.
    * @param {Object} newHandler new skin handler object.
    */
   this.setHandler = function(newHandler) {
      handler = newHandler;
      return;
   };

   return this;
};
// extend jala.Form.Component
jala.Form.extend(jala.Form.Component.Skin, jala.Form.Component);

/**
 * Renders the skin named by this component to the response.
 */
jala.Form.Component.Skin.prototype.render = function() {
   var obj = (this.getHandler()) ? this.getHandler() : this.form.getDataObj();
   obj.renderSkin(this.name, this);
   return;
};






/**
 * @class Class for rendering and validating input form elements.
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.Component.Input = function Input(name) {
   jala.Form.Component.Input.superConstructor.apply(this, arguments);

   var requirements = {};
   
   var messages = {};

   /**
    * Sets a requirement for this component.
    * If function is called without arguments, jala.Form.REQUIRED
    * is set to true.
    * @param {String} key String defining the type of requirement,
    *             constants in jala.Form may be used.
    * @param {Object} val Value of the requirement.
    * @param {String} msg Optional error message if requirement
    *             is not fulfilled.
    */
   this.require = function(key, val, msg) {
      if (arguments.length == 0) {
         // set default value for arguments
         key = jala.Form.REQUIRED;
         val = true;
      }
      requirements[key] = val;
      if (msg) {
         this.setMessage(key, msg);
      }
      return;
   };

   /**
    * Returns the requirement value for a given key.
    * @param {String} key String defining the type of requirement,
    *             constants in jala.Form may be used.
    * @type Object
    */
   this.getRequirement = function(key) {
      return requirements[key];
   };

   /**
    * Sets a custom error message
    * @param {String} key String defining the type of requirement,
    *             constants in jala.Form may be used.
    * @param {String} msg Error message
    */
   this.setMessage = function(key, msg) {
      messages[key] = msg;
      return;
   };
  
   /**
    * Returns a specific message for a config element.
    * @param {String} key The key of the message as defined by
    *          the constants in jala.Form.* (e.g. "required",
    *          "maxlength", "minlength" ...
    * @param {String} defaultMsg the message to use when no message
    *          was defined.
    * @param {Object} args One or more arguments passed to the gettext
    * message processor which will replace {0}, {1} etc.
    * @returns rendered message
    * @type String
    */
   this.getMessage = function(key, defaultMsg, args) {
      var arr = [(messages[key]) ? messages[key] : defaultMsg];
      for (var i=2; i<arguments.length; i++) {
         arr.push(arguments[i]);
      }
      return gettext.apply(null, arr);
   };




   var className, label, help = undefined;
   
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
    * The getter function for this component. If set, the
    * function is called to retrieve the original value of the
    * field. When called, the scope is set to the data object and
    * the name of the element as sole argument.
    * @see #getValue
    * @type Function
    */
   this.getter;      // for doc purposes only

   // that's where the values really are stored:
   var getter, setter, validator = undefined;

   this.__defineGetter__("getter", function() {   return getter;   });
   this.__defineSetter__("getter", function(newGetter) {
      if (newGetter instanceof Function) {
         getter = newGetter;
      }
   });


   /**
    * The setter function for this component. If set, the
    * function is called to store the new value of the
    * field. When called, the scope is set to the data object and
    * the name and value of the element are provided as arguments.
    * @see #setValue
    * @type Function
    */
   this.setter;      // for doc purposes only

   this.__defineGetter__("setter", function() {   return setter;   });
   this.__defineSetter__("setter", function(newSetter) {
      if (newSetter instanceof Function) {
         setter = newSetter;
      }
   });


   /**
    * The validator function for this component. If set, the
    * function is called with the scope set to the data object
    * and with four arguments:
    * <li>the name of the element</li>
    * <li>the parsed value of the element if all requirements have
    *     been fulfilled. E.g., for a date editor, the parsed value would
    *     be a date object.</li>
    * <li>the map containing all user inputs as string (req.data)</li>
    * <li>the form object</li>
    * @see #validate
    * @type Function
    */
   this.validator;

   this.__defineGetter__("validator", function() {   return validator;   });
   this.__defineSetter__("validator", function(newValidator) {
      if (newValidator instanceof Function) {
         validator = newValidator;
      }
   });

   return this;
};
// extend jala.Form.Component
jala.Form.extend(jala.Form.Component.Input, jala.Form.Component);

/**
 * Validates the input provided to this component. First,
 * checkRequirements is called. If no error occurs, the input
 * is parsed using parseValue and passed on to the validator
 * function.
 * @see #checkRequirements
 * @see #parseValue
 * @param {jala.Form.Tracker} tracker Tracker object collecting
 *       request data, error messages and parsed values.
 */
jala.Form.Component.Input.prototype.validate = function(tracker) {
   var error = this.checkRequirements(tracker.reqData);
   if (error != null) {
      tracker.errors[this.name] = error;
   } else {
      tracker.values[this.name] = this.parseValue(tracker.reqData);
      if (this.validator) {
         error = this.validator.call(
            this.form.getDataObj(),
            this.name,
            tracker.values[this.name],
            tracker.reqData,
            this.form
         );
         if (error != null) {
            tracker.errors[this.name] = error;
         }
      }
   }
   return;
};


/**
 * Saves the parsed value using setValue.
 * @see #setValue
 * @param {jala.Form.Tracker} tracker Tracker object collecting
 *       request data, error messages and parsed values.
 * @param {Object} destObj (optional) object whose values will be changed.
 */
jala.Form.Component.Input.prototype.save = function(tracker, destObj) {
   this.setValue(destObj, tracker.values[this.name]);
   return;
};


/**
 * Retrieves the property which is edited by this component.
 * <li>If no getter is given, the method returns the primitive property
 *    of the data object with the same name as the component.</li>
 * <li>If a getter function is defined, it is executed with the scope
 *    of the data object and the return value is used as default value.
 *    The name of the component is passed to the getter function
 *    as an argument.</li>
 * @returns The value of the property
 * @type String Number Date
 */
jala.Form.Component.Input.prototype.getValue = function() {
   if (this.form.getTracker()) {
      // handling re-rendering
      return null;
   } else if (this.getter) {
      return this.getter.call(this.form.getDataObj(), this.name);
   } else {
      return this.form.getDataObj()[this.name];
   }
};



/**
 * Sets a property of the object passed as argument to the given value.
 * <li>If no setter is set at the component, the primitive property
 *    of the data object is changed.</li>
 * <li>If a setter function is defined it is executed with the data object
 *    as scope and with the name and new value provided as arguments</li>
 * <li>If the setter is explicitly set to null, no changes are made at all.</li>
 * @param {Object} destObj (optional) object whose values will be changed.
 * @param {Object} value The value to set the property to
 * @returns True in case the update was successful, false otherwise.
 * @see jala.Form#setter
 */
jala.Form.Component.Input.prototype.setValue = function(destObj, value) {
   // default value for the setter is undefined, so if it has been
   // set to explicitly null, we don't save the value. in this case,
   // we assume, the property is handled outside of jala.Form or purposely
   // ignored at all.
   if (this.setter !== null) {
      if (this.setter) {
         this.setter.call(destObj, this.name, value);
      } else {
         destObj[this.name] = value;
      }
   }
   return;
};



/**
 * Renders this component including label, error and help messages.
 */
jala.Form.Component.Input.prototype.render = function() {
   var className = (this.required == true) ? "required" : "optional";
   if (this.getClassName()) {
      className += " " + this.getClassName();
   }

   jala.Form.html.openTag("div",
      {id: this.form.createDomId(this.name, "row"),
       "class": "row " + className
      }
   );

   renderSkin(this.form.componentSkin, this);

   jala.Form.html.closeTag("div");
   return;
};




/**
 * If the error tracker holds an error message for this component,
 * it is wrapped in a div-tag and returned as a string.
 * @returns Rendered string
 * @type String
 */
jala.Form.Component.Input.prototype.renderError = function() {
   var tracker = this.form.getTracker();
   if (tracker && tracker.errors[this.name]) {
      return jala.Form.html.elementAsString("div",
         tracker.errors[this.name],
         {id: this.form.createDomId(this.name, "error"),
          "class": "error"});
   }
   return null;
};



/**
 * Wraps the Label for this component in a div-tag and returns it
 * as a string
 * @returns Rendered string
 * @type String
 */
jala.Form.Component.Input.prototype.renderLabel = function() {
   return jala.Form.html.elementAsString(
      "label",
      this.getLabel() || "",
      {id: this.form.createDomId(this.name, "label"),
       "for": this.form.createDomId(this.name)
      }
   );
};



/**
 * If this component contains a help message, it is wrapped in
 * a div-tag and returned as a string.
 * @returns Rendered string
 * @type String
 */
jala.Form.Component.Input.prototype.renderHelp = function() {
   if (this.getHelp()) {
      return jala.Form.html.elementAsString(
         "div",
         this.getHelp(),
         {id: this.form.createDomId(this.name, "help"),
          "class": "help"
         }
      );
   }
   return null;
};


/**
 * Macro rendering this component including label, error and help messages.
 */
jala.Form.Component.Input.prototype.render_macro = function(param) {
   this.render();
};

/**
 * Macro rendering this component's controls.
 */
jala.Form.Component.Input.prototype.controls_macro = function(param) {
   var attr = this.getControlAttributes();
   var tracker = this.form.getTracker()
   if (tracker) {
      this.renderControls(attr, null, tracker.reqData);
   } else {
      this.renderControls(attr, this.getValue());
   }
   return;
};

/**
 * Macro rendering this component's error (if an error message
 * has been set).
 */
jala.Form.Component.Input.prototype.error_macro = function(param) {
   res.write(this.renderError());
   return;
};

/**
 * Macro rendering this component's label.
 */
jala.Form.Component.Input.prototype.label_macro = function(param) {
   res.write(this.renderLabel());
   return;
};

/**
 * Macro rendering this component's help text (if a help text
 * has been set).
 */
jala.Form.Component.Input.prototype.help_macro = function(param) {
   res.write(this.renderHelp());
   return;
};

/**
 * Macro rendering this component's id
 * @see jala.Form#createDomId
 */
jala.Form.Component.Input.prototype.id_macro = function(param) {
   res.write(this.form.createDomId(this.name));
   return;
};

/**
 * Creates a new attribute object for this element.
 * @returns Object with properties id, name, class
 * @type Object
 */
jala.Form.Component.Input.prototype.getControlAttributes = function() {
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
 * if the corresponding options have been set using the require method.
 * @param {Object} reqData request data
 * @returns String containing error message or null if everything is ok.
 * @type String
 * @see #require
 */
jala.Form.Component.Input.prototype.checkLength = function(reqData) {
   var required  = this.getRequirement(jala.Form.REQUIRED);
   var minLength = this.getRequirement(jala.Form.MINLENGTH);
   var maxLength = this.getRequirement(jala.Form.MAXLENGTH);
   
   if (required && (reqData[this.name] == null || reqData[this.name].trim() == "")) {
      return this.getMessage(jala.Form.REQUIRED, "Please enter text into this field!");
   } else if (maxLength && reqData[this.name].length > maxLength) {
      return this.getMessage(jala.Form.MAXLENGTH, "Input for this field is too long ({0} characters). Please enter no more than {1} characters!",
                                 reqData[this.name].length, maxLength);
   } else if (minLength) {
      // set an error if the element is required but the input is too short
      // but don't throw an error if the element is optional and empty
      if (reqData[this.name].length < minLength &&
          (required || (!required && reqData[this.name].length > 0))) {
         return this.getMessage(jala.Form.MINLENGTH, "Input for this field is too short ({0} characters). Please enter at least {1} characters!",
               reqData[this.name].length, minLength);
      }
   }
   return null;
};



/**
 * Checks user input against options set using the require method.
 * @param {Object} reqData request data
 * @returns String containing error message or null if everything is ok.
 * @type String
 * @see #checkLength
 * @see #require
 */
jala.Form.Component.Input.prototype.checkRequirements = function(reqData) {
   return this.checkLength(reqData);
};


/**
 * Parses the string input from the form and creates the datatype that
 * is edited with this component. For the input component this method
 * is not of much use, but subclasses that edit other datatypes may use
 * it. For example, a date editor should convert the user input from string
 * to a date object.
 * @param {Object} reqData request data
 * @returns parsed value
 * @type Object
 */
jala.Form.Component.Input.prototype.parseValue = function(reqData) {
   return reqData[this.name];
};


/**
 * Renders the html form elements to the response.
 * This method shall be overridden by subclasses of input component.
 * @param {Object} attr Basic attributes for the html form elements.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.Component.Input.prototype.renderControls = function(attr, value, reqData) {
   attr.value = (reqData) ? reqData[this.name] : value;
   if (this.getRequirement(jala.Form.MAXLENGTH)) {
      attr.maxlength = this.getRequirement(jala.Form.MAXLENGTH);
   }
   jala.Form.html.input(attr);
   return;
};





/**
 * @class Subclass of jala.Form.Component.Input which renders and validates a
 * password input tag.
 * @base jala.Form.Component.Input
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.Component.Password = function Password(name) {
   jala.Form.Component.Password.superConstructor.apply(this, arguments);
   return this;
};
// extend jala.Form.Component.Input
jala.Form.extend(jala.Form.Component.Password, jala.Form.Component.Input);


/**
 * Renders a password input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.Component.Password.prototype.renderControls = function(attr, value, reqData) {
   attr.value = (reqData) ? reqData[this.name] : value;
   if (this.getRequirement(jala.Form.MAXLENGTH)) {
      attr.maxlength = this.getRequirement(jala.Form.MAXLENGTH);
   }
   jala.Form.html.password(attr);
   return;
};



/**
 * @class Subclass of jala.Form.Component.Input which renders and validates a
 * textarea tag.
 * @base jala.Form.Component.Input
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.Component.Textarea = function Textarea(name) {
   jala.Form.Component.Textarea.superConstructor.apply(this, arguments);

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
// extend jala.Form.Component.Input
jala.Form.extend(jala.Form.Component.Textarea, jala.Form.Component.Input);

/**
 * Renders a textarea tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.Component.Textarea.prototype.renderControls = function(attr, value, reqData) {
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
 * @class Subclass of jala.Form.Component.Input which renders and validates a
 * date editor.
 * @base jala.Form.Component.Input
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.Component.Date = function Date(name) {
   jala.Form.Component.Date.superConstructor.apply(this, arguments);

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
// extend jala.Form.Component.Input
jala.Form.extend(jala.Form.Component.Date, jala.Form.Component.Input);

/**
 * Renders a textarea tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.Component.Date.prototype.renderControls = function(attr, value, reqData) {
   attr.value = (reqData) ? reqData[this.name] : this.getDateFormat().format(value);
   if (this.getRequirement(jala.Form.MAXLENGTH)) {
      attr.maxlength = this.getRequirement(jala.Form.MAXLENGTH);
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
jala.Form.Component.Date.prototype.checkRequirements = function(reqData) {
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
jala.Form.Component.Date.prototype.parseValue = function(reqData) {
   return this.getDateFormat().parse(reqData[this.name]);
};



/**
 * @class Subclass of jala.Form.Component.Input which renders and validates a
 * dropdown element.
 * @base jala.Form.Component.Input
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.Component.Select = function Select(name) {
   jala.Form.Component.Select.superConstructor.apply(this, arguments);
   
   var options, firstOption = undefined;
   
   /**
    * Returns the option list for this component.
    */
   this.getOptions = function() {
      return options;
   };
   
   /**
    * Sets the option list for this component.
    * The argument may either be an array that will be used as option list,
    * or a function that is called when the option component is rendered and
    * has to return an option array.
    * For both arrays those formats are allowed:
    * <li>Array of arrays <code>[ [val, display], [val, display], .. ]</code></li>
    * <li>Array of objects <code>[ {value:val, display:display}, .. ]</code></li>
    * <li>Array of strings <code>[ display, display, .. ]</code> In this case,
    *    the index position of the string will be the value.</li>
    * @param {Array Function} newOptions Array or function defining option list.
    */
   this.setOptions = function(newOptions) {
      options = newOptions;
      return;
   };
   
   /**
    * Returns the text that should be displayed if no value is selected.
    * @type String
    */
   this.getFirstOption = function() {
      return firstOption;
   };
   
   /**
    * Sets the text that is displayed if no value is selected
    * @param {String} newFirstOption text to display as first option element.
    */
   this.setFirstOption = function(newFirstOption) {
      firstOption = newFirstOption;
      return;
   };
  
   return this;
};
// extend jala.Form.Component.Input
jala.Form.extend(jala.Form.Component.Select, jala.Form.Component.Input);

/**
 * Renders a dropdown element to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.Component.Select.prototype.renderControls = function(attr, value, reqData) {
   value = (reqData) ? reqData[this.name] : value;
   jala.Form.html.dropDown(attr, this.parseOptions(), value, this.getFirstOption());
   return;
};

/**
 * Validates user input from a dropdown element by making sure that
 * the option value list contains the user input.
 * @see jala.Form.Component.Select#checkOptions
 * @param {Object} reqData request data
 * @returns string containing error message or null if everything is ok.
 * @type String
 */
jala.Form.Component.Select.prototype.checkRequirements = function(reqData) {
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
jala.Form.Component.Select.prototype.parseOptions = function() {
   var options = this.getOptions();
   if (options != null) {
      if (options instanceof Array) {
         return options;
      } else if (options instanceof Function) {
         return options.call(this.form.getDataObj(), this.name);
      }
   }
   return [];
};

/**
 * Checks user input for optiongroups: Unless require("checkoptions")
 * has ben set to false, the user input must exist in the option array.
 * @param {Object} reqData request data
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.Component.Select.prototype.checkOptions = function(reqData) {
   // if field is required, an empty option is not allowed:
   var found = (!this.getRequirement(jala.Form.REQUIRED) && !reqData[this.name]);
   if (!found) {
      if (this.getRequirement(jala.Form.CHECKOPTIONS) === false) {
         // exit, if option check shall be suppressed
         return null;
      }
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
 * @class Subclass of jala.Form.Component.Input which renders and validates a
 * set of radio buttons.
 * @base jala.Form.Component.Select
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.Component.Radio = function Radio(name) {
   jala.Form.Component.Radio.superConstructor.apply(this, arguments);
   return this;
};
// extend jala.Form.Component.Select
jala.Form.extend(jala.Form.Component.Radio, jala.Form.Component.Select);

/**
 * Renders a set of radio buttons to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.Component.Radio.prototype.renderControls = function(attr, value) {
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
 * @see jala.Form.Component.Select#checkOptions
 * @param {Object} reqData request data
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.Component.Radio.prototype.checkRequirements = function(reqData) {
   return this.checkOptions(reqData);
};






/**
 * @class Subclass of jala.Form.Component.Input which renders and validates a
 * checkbox.
 * @base jala.Form.Component.Input
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.Component.Checkbox = function Checkbox(name) {
   jala.Form.Component.Checkbox.superConstructor.apply(this, arguments);
   return this;
};
// extend jala.Form.Component.Input
jala.Form.extend(jala.Form.Component.Checkbox, jala.Form.Component.Input);

/**
 * Renders an checkbox to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 */
jala.Form.Component.Checkbox.prototype.renderControls = function(attr, value, reqData) {
   if (value == 1 || (reqData && reqData[this.name] == "1")) {
      attr.checked = "checked";
   }
   attr.value = "1";
   jala.Form.html.checkBox(attr);
   return;
};

/**
 * Parses the string input from the form. For a checked box, the value is 1,
 * for an unchecked box the value is 0.
 * @param {Object} reqData request data
 * @returns parsed value
 * @type Number
 */
jala.Form.Component.Checkbox.prototype.parseValue = function(reqData) {
   return (reqData[this.name] == "1") ? 1 : 0;
};


/**
 * Validates user input from checkbox.
 * @param {Object} reqData request data
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.Component.Checkbox.prototype.checkRequirements = function(reqData) {
   if (reqData[this.name] && reqData[this.name] != "1") {
      return this.getMessage("invalid", "The value of this checkbox is invalid.");
   }
   return null;
};








/**
 * @class Subclass of jala.Form.Component.Input which renders and validates a
 * file upload. Note that the file is not saved. Use req.data[field].writeToFile(dir, name).
 * @base jala.Form.Component.Input
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.Component.File = function File(name) {
   jala.Form.Component.File.superConstructor.apply(this, arguments);

   this.containsFileUpload = function() {
      return true;
   };

   return this;
};
// extend jala.Form.Component.Input
jala.Form.extend(jala.Form.Component.File, jala.Form.Component.Input);

/**
 * Renders a file input tag to the response.
 * @param {Object} attr Basic attributes for this element.
 * @param {Object} value Value to be used for rendering this element.
 * @param {Object} reqData Request data for the whole form. This argument is
 *       passed only if the form is re-rendered after an error occured.
 */
jala.Form.Component.File.prototype.renderControls = function(attr, value, reqData) {
   var contentType = this.getRequirement(jala.Form.CONTENTTYPE);
   if (contentType) {
      attr.accept = (contentType instanceof Array) ? contentType.join(",") : contentType;
   }
   jala.Form.html.file(attr);
   return;
};

/**
 * Validates a file upload by making sure it's there (if REQUIRED is set),
 * checking the file size, the content type and by trying to construct an image.
 * @param {Object} reqData request data
 * @param {jala.Form.Tracker} tracker jala.Form.Tracker object storing possible error messages
 * @returns null if everything is ok or string containing error message
 * @type String
 */
jala.Form.Component.File.prototype.checkRequirements = function(reqData) {

   if (reqData[this.name].contentLength == 0) {
      // no upload
      if (this.getRequirement(jala.Form.REQUIRED) == true) {
         return this.getMessage(jala.Form.REQUIRED, "File upload is required.");
      } else {
         // no further checks necessary, exit here
         return null;
      }
   }

   var maxLength = this.getRequirement(jala.Form.MAXLENGTH);
   if (maxLength && reqData[this.name].contentLength > maxLength) {
      return this.getMessage(jala.Form.MAXLENGTH, "This file is too big ({0} bytes), maximum allowed size {1} bytes.",
            reqData[this.name].contentLength, maxLength);
   }
   
   var contentType = this.getRequirement(jala.Form.CONTENTTYPE);
   if (contentType) {
      var arr = (contentType instanceof Array) ? contentType : [contentType];
      if (arr.indexOf(reqData[this.name].contentType) == -1) {
         return this.getMessage(jala.Form.CONTENTTYPE, "The file type {0} is not allowed.",
            reqData[this.name].contentType);
      }
   }
   
   return null;
};









/**
 * @class Subclass of jala.Form.Component.File which renders a file upload
 * and validates uploaded files as images. Note that the file is not saved.
 * Use req.data[field].writeToFile(dir, name).
 * @base jala.Form.Component.File
 * @param {String} name Name of the component, used as name of the html controls.
 * @constructor
 */
jala.Form.Component.Image = function Image(name) {
   jala.Form.Component.Image.superConstructor.apply(this, arguments);
   
   return this;
};
// extend jala.Form.Component.File
jala.Form.extend(jala.Form.Component.Image, jala.Form.Component.File);



/**
 * Validates an image upload by making sure it's there (if REQUIRED is set),
 * checking the file size, the content type and by trying to construct an image.
 * If the file is an image, width and height limitations set by require are
 * checked.
 * @param {Object} reqData request data
 * @type String
 */
jala.Form.Component.Image.prototype.checkRequirements = function(reqData) {
   var re = this.constructor.superConstructor.prototype.checkRequirements.call(this, reqData);
   if (re) {
      return re;
   }

   if (reqData[this.name].contentLength > 0) {
      var helmaImg = undefined;
      try {
         helmaImg = new Image(reqData[this.name]);
      } catch (imgError) {
         return this.getMessage("invalid", "This image file can't be processed.");
      }
   
      var maxWidth = this.getRequirement(jala.Form.MAXWIDTH);
      if (maxWidth && helmaImg.getWidth() > maxWidth) {
         return this.getMessage("maxwidth", "This image is too wide.");
      }
      
      var minWidth = this.getRequirement(jala.Form.MINWIDTH);
      if (minWidth && helmaImg.getWidth() < minWidth) {
         return this.getMessage("minwidth", "This image is not wide enough.");
      }
      
      var maxHeight = this.getRequirement(jala.Form.MAXHEIGHT);
      if (maxHeight && helmaImg.getHeight() > maxHeight) {
         return this.getMessage("maxheight", "This image is too tall.");
      }
      
      var minHeight = this.getRequirement(jala.Form.MINHEIGHT);
      if (minHeight && helmaImg.getHeight() < minHeight) {
         return this.getMessage("minheight", "This image is not tall enough.");
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
    * fail during checkRequirements method).
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

/** @ignore */
jala.Form.Tracker.toString = function() {
   return "[jala.Form.Tracker]";
}

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

/** @ignore */
jala.Form.Tracker.prototype.toString = jala.Form.Tracker.toString;

