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
// Version 0.0.1
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

    var resp = http.request(BASE_URL).toString();
    var channels = [];
    var document = html.parse(resp).root;

    var channels = document.getElementByClassName("sidebar sidebar-block")[0];

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

plugin.addURI(PREFIX + ":channel:(.*):(.*)", function(page, url, title) {
    //page.type = "directory";
    page.metadata.title = title;
    var url = BASE_URL + url;
    var resp = http.request(url).toString();
    var dom = html.parse(resp).root;

    page.type = "video";
    page.loading = false;
    page.source = GetServer(dom);
    page.title = title;

    page.loading = false;
});

plugin.addURI(PREFIX + ":start", startPage);

function GetServer(document) {

    var player = document.getElementById("player");
    var archive = player.attributes.getNamedItem("data-archive").value;
    var date = player.attributes.getNamedItem("data-date").value;
    var id = player.attributes.getNamedItem("data-id").value;
    var stream = player.attributes.getNamedItem("data-stream").value;
    var currnet_stream = false;

    if (
        document.getElementById("player-box").attributes.getNamedItem("data-src") &&
        document.getElementById("player-box").attributes.getNamedItem("data-src") != ""
    ) {
        currnet_stream = document.getElementById("player-box").attributes.getNamedItem("data-src");
    }

    json = http.request(BASE_URL + "/original/getserver/GetServer", {
        debug: true,
        method: "POST",
        postdata: { archive: archive, date: date, id: id, stream: stream, currnet_stream: currnet_stream }
    });

    json = JSON.parse(json);
    return json.player;
};