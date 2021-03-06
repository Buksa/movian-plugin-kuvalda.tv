/**
 *  kuvalda.tv plugin for Movian by Buksa
 *
 *  Copyright (C) 2017 Buksa
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
// Version 0.1.3
//
var http = require("showtime/http");
var html = require("showtime/html");
var BASE_URL = "http://www.kuvalda.tv";

var plugin_info = plugin.getDescriptor();
var PREFIX = plugin_info.id;
var logo = plugin.path + plugin_info.icon;

var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true, logo);
//settings
var settings = plugin.createSettings(plugin_info.title, logo, plugin_info.synopsis);
settings.createInfo("info", logo, "Plugin developed by " + plugin_info.author + ". \n");
settings.createDivider("Settings:");

settings.createBool("debug", "Debug", false, function(v) {
    service.debug = v;
});

function startPage(page) {
    page.type = "directory";
    // page.model.contents = "grid";
    page.metadata.icon = logo;
    page.metadata.logo = logo;
    page.metadata.title = "Kuvalda.tv : Список Каналов";
    page.loading = true;

    var resp = http.request(BASE_URL, {
        debug: service.debug,
        noFail: true, // Don't throw on HTTP errors (400- status code)
        compression: true, // Will send 'Accept-Encoding: gzip' in request
        caching: true, // Enables Movian's built-in HTTP cache
        cacheTime: 3600
    });
    var channels = [];
    var dom = html.parse(resp).root;

    var channels = dom.getElementByClassName("sidebar sidebar-block")[0];

    for (var i = 0; i < channels.children.length; i++) {
        var item = {
            url: channels.children[i].getElementByTagName("a")[0].attributes.getNamedItem("href").value,
            title: channels.children[i].getElementByClassName("menu-text")[0].textContent,
            icon: BASE_URL + channels.children[i].getElementByTagName("img")[0].attributes.getNamedItem("src").value,
            backdrop: BASE_URL + channels.children[i].getElementByTagName("img")[0].attributes.getNamedItem("src").value

            //icon: plugin.path + "img/" + m[1] + ".png"
        };

        page.appendItem(PREFIX + ":channel:" + item.url + ":" + item.title, "directory", {
            title: new showtime.RichText(item.title),
            icon: item.icon,
            backdrop: item.backdrop
        });
    }

    page.loading = false;
}
plugin.addURI(PREFIX + ":play:(.*)", function(page, url) {
    var resp = http.request(BASE_URL + url, {
        debug: service.debug,
        noFail: true, // Don't throw on HTTP errors (400- status code)
        compression: true, // Will send 'Accept-Encoding: gzip' in request
        caching: true, // Enables Movian's built-in HTTP cache
        cacheTime: 3600
    });
    var dom = html.parse(resp).root;

    data = GetServer(page, dom);
    if (data.error == "0") {
        page.type = "video";
        page.source = "hls:" + data.player;
    } else page.error(data.text);
    page.loading = false;
});

plugin.addURI(PREFIX + ":channel:(.*):(.*)", function(page, url, title) {
    page.type = "directory";
    page.loading = true;
    page.metadata.title = title;

    var resp = http.request(BASE_URL + url, {
        debug: service.debug,
        noFail: true, // Don't throw on HTTP errors (400- status code)
        compression: true, // Will send 'Accept-Encoding: gzip' in request
        caching: true, // Enables Movian's built-in HTTP cache
        cacheTime: 3600
    });
    var dom = html.parse(resp).root;

    page.appendItem(PREFIX + ":play:" + url, "directory", {
        title: new showtime.RichText("LIVE")
    });

    GetWeekProgram(page, dom);

    page.loading = false;
});

plugin.addURI(PREFIX + ":start", startPage);

function GetServer(page, dom) {
    var player = dom.getElementById("player");
    var archive = player.attributes.getNamedItem("data-archive").value;
    var date = player.attributes.getNamedItem("data-date").value;
    var id = player.attributes.getNamedItem("data-id").value;
    var stream = player.attributes.getNamedItem("data-stream").value;
    var currnet_stream = false;

    if (
        dom.getElementById("player-box").attributes.getNamedItem("data-src") &&
        dom.getElementById("player-box").attributes.getNamedItem("data-src") != ""
    ) {
        currnet_stream = dom.getElementById("player-box").attributes.getNamedItem("data-src");
    }

    json = http.request(BASE_URL + "/original/getserver/GetServer", {
        debug: service.debug,
        noFail: true, // Don't throw on HTTP errors (400- status code)
        compression: true, // Will send 'Accept-Encoding: gzip' in request
        caching: true, // Enables Movian's built-in HTTP cache
        cacheTime: 3600,
        method: "POST",
        postdata: { archive: archive, date: date, id: id, stream: stream, currnet_stream: currnet_stream }
    });

    json = JSON.parse(json);
    return json;
}

function GetWeekProgram(page, dom) {
    page.type = "directory";
    page.loading = true;

    var channel = dom.getElementByClassName("active-program")[0].attributes.getNamedItem("data-channel").value;
    var date = dom.getElementByClassName("active-program")[0].attributes.getNamedItem("data-cdate").value;
    var time = dom.getElementByClassName("active-program")[0].attributes.getNamedItem("data-time").value;
    var isdisable = dom.getElementByClassName("active-program")[0].attributes.getNamedItem("data-isdisable").value;

    var url = "/original/getweekprogram/GetWeekProgram/";
    resp = http.request(BASE_URL + "/original/getweekprogram/GetWeekProgram/", {
        debug: service.debug,
        noFail: true, // Don't throw on HTTP errors (400- status code)
        compression: true, // Will send 'Accept-Encoding: gzip' in request
        caching: true, // Enables Movian's built-in HTTP cache
        cacheTime: 3600,
        method: "POST",
        postdata: { channel: channel, date: date }
    });
    var dom = html.parse(resp).root;
    var program_list = dom.getElementByTagName("a");

    for (var i = 0; i < program_list.length; i++) {
        var item = {
            url: program_list[i].attributes.getNamedItem("href").value,
            title: program_list[i].textContent.replace(/(:\d{2})/, "$1 ")
        };
        if (item.url !== "#")
            page.appendItem(PREFIX + ":play:" + item.url, "directory", {
                title: new showtime.RichText(item.title),
                icon: item.icon,
                backdrop: item.backdrop
            });
    }
}