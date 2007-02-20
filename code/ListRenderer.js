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
 * @fileoverview Fields and methods of the jala.ListRenderer class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * HelmaLib dependencies
 */
app.addRepository("modules/helma/Html.js");

/**
 * Construct a list renderer.
 * @class This class eases the rendering of arbitrary lists.
 * Such lists can be represented by HopObject collections or 
 * Arrays of HopObjects. Various arguments provide customization
 * of the number of items per page, the maximum of pages and so on.
 * @param {Object} listParam Customization parameters:
 * <ul>
 * <li>collection - Collection or Array of HopObjects.</li>
 * <li>currentPage - Optional index of the current page 
 * (<code>req.data.page</code>)</li>
 * <li>itemsPerPage - The optional number of items per list page.</li>
 * <li>maxPages - The optional maximum number of pages.</li>
 * <li>href - An optional URL string to link to.</li>
 * <li>urlParams - Optional extra URL parameters.</li>
 * </ul>
 * @param {Object} renderers The list types and renderer methods 
 * used to render the single items in a list.
 * @returns A new list renderer instance.       
 * @throws Exception if an ArrayList containing a subset of a bigger 
 * Array and has too view elements for one page or the last page.       
 * @constructor
 */
jala.ListRenderer = function(listParam, renderers) {
   var collectionSize;
   var collection;
   var currentPage;
   var itemsPerPage;
   var maxPages;
   var totalPages;
   var href;
   var urlParams;
   var urlParamName;
   var listItemSkin;

   var cache = {
      pageNavigation: null,
      prevLink: null,
      nextLink: null
   };

   var setTotalPages = function() {
      if (maxPages)
         totalPages = Math.min(maxPages, Math.ceil(collectionSize / itemsPerPage));
      else
         totalPages = Math.ceil(collectionSize / itemsPerPage);
      return;
   };

   var getRenderFunction = function(handlerName, fName) {
      if (!fName)
         fName = "default";
      var handler;
      if (renderers != null && (handler = renderers[handlerName]) != null) {
         if (handler[fName] instanceof Function) {
            return handler[fName];
         }
      }
      // no renderer found, try to find a default renderer
      if ((handler = jala.ListRenderer.defaultRenderer[handlerName]) != null) {
         return handler[fName];
      }
      return null;
   };

   var getHref = function(page) {
      if (urlParams) {
         if (page)
            return String.compose(href, "?", urlParams, "&", urlParamName, "=", page);
         else
            return String.compose(href, "?", urlParams);
      } else {
         if (page)
            return String.compose(href, "?", urlParamName, "=", page);
         else
            return href;
      }
   };

   /**
    * Returns true if this ListRenderer instance
    * has already a listItemSkin set.
    */
   this.hasListItemSkin = function() {
      return listItemSkin != null;
   };
   
   /**
    * Set the amount of items shown per page.
    * @param {int} limit The maximum number of items per page.
    */
   this.setPageSize = function(limit) {
      if (collectionSize == 0)
         return;
      if (limit && !isNaN(limit)) {
         // got a different itemsPerPage count, so recalculate
         itemsPerPage = parseInt(limit, 10);
         setTotalPages();
      }
      // correct currentPage if necessary
      currentPage = Math.min(Math.max(1, currentPage), totalPages);
      return;
   };
   
   /**
    * Set the current Page.
    * @param (int) the current Page
    */
   this.setCurrentPage = function (page) {
      currentPage = page;
   };
   
   /**
    * Returns the current Page.
    * @returns the current Page.
    */
   this.getCurrentPage = function () {
      return currentPage;
   };
   
   this.getSize = function () {
      return collectionSize;
   };

   /**
    * Render the list.
    * @param {Object} param Object containing
    * extra parameters (e.g. from a Hop macro call).
    */
   this.renderList = function(param) {
      if (collectionSize == 0 || totalPages == 0)
         return null;
      var idx, stop;
      this.setPageSize();
      if (itemsPerPage) {
         idx = ((currentPage -1) * itemsPerPage);
         stop = Math.min(idx + itemsPerPage, collectionSize);
      } else {
         idx = 0;
         stop = collectionSize;
         itemsPerPage = stop;
      }
      // preload objects if collection is a HopObject one
      if (collection instanceof HopObject) {
         collection.prefetchChildren(idx, stop - idx);
      }

      var prevItem = null;
      if (!param)
         var param = {};
      var renderFunc = getRenderFunction("list", param.type);
      param.counter = 1;
      param.index = idx + 1;
      param.stop = stop;
      param.itemsPerPage = itemsPerPage;
      param.collectionSize = collectionSize;
      if (!param.skin && listItemSkin)
         param.skin = listItemSkin;
      while (idx < stop) {
         var item = collection.get(idx++);
         renderFunc(item, prevItem, param);
         prevItem = item;
         param.counter += 1;
         param.index += 1;
      }
      return;
   };

   /**
    * Render the list as string.
    * @param {Object} param Object containing
    * extra parameters (e.g. from a Hop macro call).
    * @returns The rendered list.
    * @type String
    * @see jala.ListRenderer#renderList
    */
   this.renderListAsString = function(param) {
      res.push();
      this.renderList(param);
      return res.pop();
   };

   /**
    * Render a link to the previous page as string.
    * @param {Object} param Object containing
    * extra parameters (e.g. from a Hop macro call).
    * @returns The rendered link to the previous page.
    * @type String
    */
   this.renderPrevLinkAsString = function(param) {
      if (collectionSize == 0 || currentPage <= 1)
         return null;
      if (!cache.prevLink) {
         res.push();
         param.index = currentPage -1;
         param.href = getHref(param.index);
         var renderFunc = getRenderFunction("pageLink", param.type);
         if (!renderFunc)
            return "[render function missing]";
         renderFunc("prev", param);
         cache.prevLink = res.pop();
      }
      return cache.prevLink;
   };

   /**
    * Render a link to the previous page.
    * @param {Object} param Object containing
    * extra parameters (e.g. from a Hop macro call).
    * @see jala.ListRenderer#renderPrevLink
    */
   this.renderPrevLink = function(param) {
      res.write(this.renderPrevLinkAsString(param));
      return;
   };

   /**
    * Render a link to the next page as string.
    * @param {Object} param Object containing
    * extra parameters (e.g. from a Hop macro call).
    * @returns The rendered link to the next page.
    * @type String
    */
   this.renderNextLinkAsString = function(param) {
      if (collectionSize == 0 || currentPage >= totalPages)
         return null;
      if (!cache.nextLink) {
         res.push();
         param.index = currentPage +1;
         param.href = getHref(param.index);
         var renderFunc = getRenderFunction("pageLink", param.type);
         if (!renderFunc)
            return "[render function missing]";
         renderFunc("next", param);
         cache.nextLink = res.pop();
      }
      return cache.nextLink;
   };

   /**
    * Render a link to the next page.
    * @param {Object} param Object containing
    * extra parameters (e.g. from a Hop macro call).
    * @see jala.ListRenderer#renderNextLink
    */
   this.renderNextLink = function(param) {
      res.write(this.renderNextLinkAsString(param));
      return;
   };

   /**
    * Render a page navigation bar.
    * @param {Object} param Object containing
    * extra parameters (e.g. from a Hop macro call).
    * @see jala.ListRenderer#renderPageNavigationAsString
    */
   this.renderPageNavigation = function(param) {
      res.write(this.renderPageNavigationAsString(param));
      return;
   };

   /**
    * Render a page navigation bar as string.
    * @param {Object} param Object containing
    * extra parameters (e.g. from a Hop macro call).
    * @returns The rendered page navigation bar.
    * @type String
    */
   this.renderPageNavigationAsString = function(param) {
      /**
       * Private method for rendering a single navigation item
       */
      var renderItem = function(text, currPage, selected) {
         renderFunc("item", {text: text,
                             url: getHref(currPage),
                             selected: selected});
         return;
      };

      if (collectionSize == 0 || totalPages <= 1)
         return null;
      if (!cache.pageNavigation) {
         var renderFunc = getRenderFunction("pageNavigation", param.type);
         if (!renderFunc)
            return "[Render function missing]";

         var navLength = parseInt(param.length, 10) || 10;
         // correct currentPage if necessary
         this.setPageSize();
         var navParam = {
            from: ((currentPage -1) * itemsPerPage) +1,
            to: Math.min(((currentPage -1) * itemsPerPage) + itemsPerPage, collectionSize),
            total: collectionSize
         }
      
         // render the navigation-bar
         res.push();
         if (currentPage > 1)
            renderItem((param.previous || "prev"), currentPage -1);
         var pageNr = 1 + Math.floor((currentPage -1) / navLength) * navLength;
         if (pageNr > 1)
            renderItem((param.previousN || "[..]"), pageNr - navLength);
         var stop = Math.min(pageNr + navLength, totalPages +1);
      
         while (pageNr < stop) {
            renderItem((param.itemPrefix || "") + pageNr + (param.itemSuffix || ""),
                       pageNr,
                       pageNr == currentPage);
            pageNr++;
         }
         if (pageNr < totalPages)
            renderItem((param.nextN || "[..]"), pageNr);
         if (currentPage < totalPages)
            renderItem((param.next || "next"), (currentPage +1));
         navParam.pageNavigation = res.pop();
         res.push();
         renderFunc("navigation", navParam);
         cache.pageNavigation = res.pop();
      }
      return cache.pageNavigation;
   };

   // object initialization
   // FIXME: this is for backwards compatibility only
   if (listParam.collection instanceof Array) {
      collection = new jala.ListRenderer.ArrayList(listParam.collection);
   } else {
      collection = listParam.collection;
   }
   
   collectionSize = collection.size();
   href = listParam.href || "";
   urlParams = listParam.urlParams;
   urlParamName = listParam.urlParamName || "page";
   currentPage = (!listParam.currentPage || isNaN(listParam.currentPage)) ? 1 : parseInt(listParam.currentPage, 10);
   itemsPerPage = !listParam.itemsPerPage ? collectionSize : parseInt(listParam.itemsPerPage, 10);
   maxPages = listParam.maxPages;
   listItemSkin = listParam.itemSkin;
   // calculate the number of pages
   setTotalPages();

   return this;
};

/**
 * Static instance of helma.Html
 * @type helma.Html
 */
jala.ListRenderer.html = new helma.Html();

/** @ignore */
jala.ListRenderer.prototype.toString = function() {
   return "[jala.ListRenderer]";
};



/*********************************
 ********** M A C R O S **********
 *********************************/


/**
 * Render the maximum number of items per page.
 * @param {Object} param Extra Hop macro parameters:
 * <ul>
 * <li>to - The maximum number of items per page to be set.
 * </ul>
 */
jala.ListRenderer.prototype.limit_macro = function(param) {
   if (param.to)
      this.setPageSize(param.to);
   // FIXME: we should implement this:
   //else
   //   res.write(this.getPageSize());
   return;
};


/**
 * Render the link to the previous page.
 * @param {Object} param Extra Hop macro parameters:
 * <ul>
 * <li>type - The type of renderer to be applied.</li>
 * </ul>
 * @see jala.ListRenderer#renderPrevLink
 */
jala.ListRenderer.prototype.prevLink_macro = function(param) {
   this.renderPrevLink(param);
   return;
};

/**
 * Render the link to the next page.
 * @param {Object} param Extra Hop macro parameters:
 * <ul>
 * <li>type - The type of renderer to be applied.</li>
 * </ul>
 * @see jala.ListRenderer#renderNextLink
 */
jala.ListRenderer.prototype.nextLink_macro = function(param) {
   this.renderNextLink(param);
   return;
};


/**
 * Render the page navigation bar.
 * @param {Object} param Extra Hop macro parameters:
 * <ul>
 * <li>type - The type of renderer to be applied.</li>
 * </ul>
 * @see jala.ListRenderer#renderPageNavigationAsString
 */
jala.ListRenderer.prototype.pageNavigation_macro = function(param) {
   this.renderPageNavigation(param);
   return;
};

/**
 * Return the current page
 */
jala.ListRenderer.prototype.currentPage_macro = function (param) {
   return this.getCurrentPage();
}

/**
 * Return the total number of items
 */
jala.ListRenderer.prototype.size_macro = function (param) {
   return this.getSize();
}

/**
 * Render the list.
 * @param {Object} param Extra Hop macro parameters:
 * <ul>
 * <li>skin - The name of the main list skin.</li>
 * <li>type - The type of renderer to be applied.</li>
 * </ul>
 * @see jala.ListRenderer#renderList
 */
jala.ListRenderer.prototype.render_macro = function(param) {
   if (!param.skin && !this.hasListItemSkin())
      return "[Name of skin missing]";
   this.renderList(param);
   return;
};



/*****************************************************
 ********** D E F A U L T   R E N D E R E R **********
 *****************************************************/


/**
 * Default Renderer object containing functions
 * used for rendering different list items (eg. page navigation,
 * prev/next links and list items).
 * @final
 */
jala.ListRenderer.defaultRenderer = {
   /**
    * List renderer object
    */
   list: {
      /**
       * Default renderer method for a list
       * @param {Object} item The current list item to render.
       * @param {Object} prevItem The previous list item
       * @param {Object} param A parameter object containing macro attributes
       * and some parameters set by the ListRenderer.
       */
      "default": function(item, prevItem, param) {
         var p = {"class": (param.index % 2 == 0 ? "even" : "odd")};
         item.renderSkin(param.skin, p);
         return;
      }
   },

   /**
    * Pagenavigation renderer object
    */
   pageNavigation: {
      /**
       * Default renderer method for a pagenavigation bar.
       * @param {String} what A string indicating what should be rendered. Can be
       * either "item" or "navigation" (the former is a single page link, the latter
       * is the whole navigation.
       * @param {Object} A parameter object containing the macro attributes and some
       * attributes set by the ListRenderer.
       */
      "default": function(what, param) {
         var skin;
         switch (what) {
            case "item":
               if (param.selected == true) {
                  param["class"] = "selected";
               } else {
                  delete param["class"];
               }
               param.text = jala.ListRenderer.html.linkAsString({href: param.url}, param.text);
               if (param.skin != null) {
                  renderSkin(param.skin, param);
               } else if ((skin = app.getSkin("Global", "pageNavigationItem", res.skinpath)) != null) {
                  renderSkin(skin, param);
               } else {
                  if (param["class"]) {
                     res.write('<span class="' + param["class"] + '">[');
                  } else {
                     res.write("<span>[");
                  }
                  res.write(param.text);
                  res.write(']</span>');
               }
               break;

            case "navigation":
               if (param.skin != null) {
                  renderSkin(param.skin, param);
               } else if ((skin = app.getSkin("Global", "pageNavigation", res.skinpath)) != null) {
                  renderSkin(skin, param);
               } else {
                  res.write('<div class="pageNavigation">');
                  res.write('<span class="summary">displaying ');
                  res.write(param.from);
                  res.write("-");
                  res.write(param.to);
                  res.write(" (of ");
                  res.write(param.total);
                  res.write(")</span>");
                  res.write('<span class="pages">');
                  res.write(param.pageNavigation);
                  res.write("</span></div>");
               }
               break;
         }
         return;
      }
   },

   /**
    * Pagelink renderer object
    */
   pageLink: {
      /**
       * Default rendering method for a page link (aka "prev/next" link)
       * @param {String} what A string indicating what should be rendered. Can be
       * either "prev" or "next"
       * @param {Object} param A parameter object containing macro attributes and
       * some set by the ListRenderer.
       */
      "default": function(what, param) {
         delete param.index;
         if (param.skin) {
            renderSkin(param.skin, param);
         } else {
            jala.ListRenderer.html.link(param, param.text || what);
         }
         return;
      }
   }
};



/*****************************************************
 ********** D E F A U L T   R E N D E R E R **********
 *****************************************************/



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
jala.ListRenderer.ArrayList = function(arr, offset, total) {
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
};

/** @ignore */
jala.ListRenderer.ArrayList.prototype.toString = function() {
   return "[jala.ListRenderer.ArrayList]";
};