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
 * @fileoverview Fields and methods of the jala.Renderings class.
 */

// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}

/**
 * Constructs a new Renderings object.
 * @class This class provides various convenience
 * methods for rendering purposes.
 * @constructor
 */
jala.Date = function() {
   return this;
};

/**
 * Renders a timestamp as set of DropDown boxes, following the
 * format passed as argument. Every &lt;select&gt;
 * item is prefixed with a string so that it can be retrieved
 * easily from the values of a submitted POST request.
 * @param {String} prefix The prefix to use for all dropdown boxes, eg. "postdate"
 * @param {Date} date A Date object to use as preselection (optional)
 * @param {Object} param Array containing one parameter object for every single
 * select box that should be rendered, with the following properties set:
 * <ul>
 * <li>pattern - The date format pattern that should be rendered. Valid
 * patterns are: "dd", "MM", "yyyy", "HH", "ss".</li>
 * <li>firstOption - The string to use as first option, eg.: "choose a day"</li>
 * </ul>
 */
jala.Date.prototype.renderEditor = function(prefix, date, param) {
   /**
    * rendering method
    * @private
    */
   var render = function(param, date) {
      switch (param.pattern) {
         case "dd":
         param.offset = 1;
         param.max = 31;
         param.selected = (date ? date.getDate() : null);
         break;

         case "MM":
         param.offset = 1;
         param.max = 12;
         param.selected = (date ? date.getMonth() +1 : null);
         break;

         case "yyyy":
         param.offset = 2002;
         param.max = 20;
         param.selected = (date ? date.getFullYear() : null);
         break;

         case "HH":
         param.offset = 0;
         param.max = 24;
         param.selected = (date ? date.getHours() : null);
         break;

         case "mm":
         param.offset = 0;
         param.max = 60;
         param.selected = (date ? date.getMinutes() : null);
         break;

         case "ss":
         param.offset = 0;
         param.max = 60;
         param.selected = (date ? date.getSeconds() : null);
         break;
      }

      var key = prefix + ":" + param.pattern;
      if (req.data[key])
         param.selected = req.data[key];
      var options = [];
      var opt;
      for (var i=0;i<param.max;i++) {
         opt = (param.offset + i).format("00");
         options[i] = [opt, opt];
      }
      Html.dropDown({name: key}, options, param.selected, param.firstOption);
   }

   if (!fmt)
      var fmt = [{pattern: "dd", firstOption: "day"},
                 {pattern: "MM", firstOption: "month"},
                 {pattern: "yyyy", firstOption: "year"},
                 {pattern: "HH", firstOption: "hour"},
                 {pattern: "mm", firstOption: "minute"}];

   for (var i in fmt) {
      render(fmt[i], date);
   }
   return;
};

/**
 * Returns a timestamp as set of dropdown-boxes
 * @see #renderEditor
 * @type String
 */
jala.Date.prototype.renderEditorAsString = function(prefix, date, pattern) {
   res.push();
   this.renderEditor(prefix, date, pattern);
   return res.pop();
};

/**
 * Renders a calendar based on a grouped collection of HopObjects. This method
 * uses a rendering object passed as arguments, that <em>must</em> implement
 * the following methods:
 * <ul>
 * <li>navigation</li>
 * <li>dayheader</li>
 * <li>day</li>
 * <li>week</li>
 * <li>calendar</li>
 * </ul>
 * For a description of the arguments passed to these methods please
 * see yourself in the source code of this method.
 * @param {HopObject} collection A grouped HopObject collection to work on
 * @param {Object} renderer A Renderer object which contains the rendering methods listed above
 * @param {String} today A string to highlight in calendar (in format 'yyyyMMdd')
 */
jala.Date.prototype.renderCalendar = function(collection, renderer, today) {
   var size = collection.size();
   if (size == null)
      return;

   /**
    * private method for rendering the links to
    * previous/next month
    */
   var linkToMonth = function(which, dayIndex) {
      var d;
      switch (which) {
         case "prev":
         if (size <= dayIndex)
            return;
         if (!(d = collection.get(dayIndex +1)))
            return;
         break;

         case "next":
         if (dayIndex == 0)
            return;
         if (!(d = collection.get(dayIndex - 1)))
            return;
         break;
      }
      date.setFullYear(d.groupname.substring(0, 4),
                    d.groupname.substring(4, 6) -1,
                    d.groupname.substring(6));
      return renderer.navigation({day: d,
                date: date,
                text: monthNames[d.groupname.substring(4, 6) -1]},
                collection);
   }

   // define variables needed in this function
   var calParam = {};
   var dayParam = {};
   var cal = java.util.Calendar.getInstance();
   var firstDayOfWeek = cal.getFirstDayOfWeek();

   var symbols = jala.util.getDateSymbols();
   var weekdays = symbols.getShortWeekdays();
   var monthNames = symbols.getMonths();

   res.push();
   // header-row
   res.push();
   for (var i=0;i<7;i++) {
      dayParam.text = weekdays[(i+firstDayOfWeek-1)%7+1];
      renderer.dayheader(dayParam, collection);
   }
   renderer.week({week: res.pop()}, collection);

   cal.set(java.util.Calendar.DATE, 1);
   // check whether there's a day in path
   // if so, use it to determine the month to render
   if (today) {
      cal.set(java.util.Calendar.YEAR, today.getFullYear());
      cal.set(java.util.Calendar.MONTH, today.getMonth());
   }
   // nr. of empty days in rendered calendar before the first day of month appears
   var pre = (7-firstDayOfWeek+cal.get(java.util.Calendar.DAY_OF_WEEK)) % 7;
   var days = cal.getActualMaximum(java.util.Calendar.DATE);
   var weeks = Math.ceil((pre + days) / 7);
   var daycnt = 1;

   calParam.month = monthNames[cal.get(java.util.Calendar.MONTH)];
   calParam.year =  cal.get(java.util.Calendar.YEAR);

   // pre-render the year and month so we only have to append the days as we loop
   var date = cal.getTime();
   // remember the index of the first and last days within this month.
   // this is needed to optimize previous and next month links.
   var lastDayIndex = 9999999;
   var firstDayIndex = -1;

   for (var i=0;i<weeks;i++) {
      res.push();
      for (var j=0;j<7;j++) {
         if ((i == 0 && j < pre) || daycnt > days)
            dayParam.text = null;
         else {
            date.setDate(daycnt);
            dayParam.text = daycnt;
            dayParam.day = collection.get(date.format(GROUPFORMAT));
            if (dayParam.day) {
               var idx = collection.contains(dayParam.day);
               if (idx > -1) {
                  if  (idx > firstDayIndex)
                     firstDayIndex = idx;
                  if (idx < lastDayIndex)
                     lastDayIndex = idx;
               }
            }
            dayParam.date = date;
            dayParam.selected = today ? date.equals(today) : false;
            daycnt++;
         }
         renderer.day(dayParam, collection);
      }
      renderer.week({week: res.pop()}, collection);
   }
   calParam.back = linkToMonth("prev", firstDayIndex);
   calParam.forward = linkToMonth("next", lastDayIndex);
   calParam.calendar = res.pop();
   renderer.calendar(calParam, collection);
   return;
};

/**
 * Returns a rendered calendar
 * @see #renderCalendar
 * @type String
 */
jala.Date.renderCalendarAsString = function(collection, renderer, today) {
   res.push();
   this.renderCalendar(collection, renderer, today);
   return res.pop();
};

/**
 * Default date class instance.
 * @type jala.Date
 * @final
 */
jala.date = new jala.Date();
