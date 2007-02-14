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
 * Declare which test methods should be run in which order
 * @type Array
 * @final
 */
var tests = [
   "testGetLinks"
];

/**
 * Simple test of the HtmlDocument.getLinks method.
 * An instance of HtmlDocument is created from a very 
 * simple HTML source. The result of getLinks is then
 * evaluated and tested.
 */
var testGetLinks = function() {
   var url = "http://user@localhost:80/path/to/file.html";
   var text = "test";
   var source = '<html><title>Test</title><body>' +
                '<h1>Hello, World!</h1>' +
                '<a href="http://localhost">localhost</a>' +
                '<a href="' + url + '">' + text + '</a>' +
                '</body></html>';
   var html = new jala.HtmlDocument(source);
   var links = html.getLinks();
   assertEqual(links.constructor, Array);
   assertEqual(links.length, 2);
   assertEqual(links[0].constructor, Object);
   assertNotUndefined(links[0].url);
   assertNotUndefined(links[0].text);
   assertEqual(links[1].url, url);
   assertEqual(links[1].text, text);
   return;
};
