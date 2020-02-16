"use strict";

const fs     = require("fs");
const ejs    = require("ejs");
const watch  = require("watch");
const marked = require("marked");


const config = {
  root: "./src",
  options: {
    interval: 0.3
  },
  templates: {
    html: {
      root: "./public",
      ext: ".html",
      template: "template/hatena.html.ejs"
    }
  }
}

const template = function(path){
  let stat = fs.statSync(path);

  if(stat.isFile()) {
    console.log(path);

    fs.readFile(path, function(err,full){
      if(err) {
        console.log(err);
      } else {
        let base = path.replace(/^src/, "");

        let tips = full.toString().split("\n");
        let title = tips[0].replace(/^[# ]*/,"");
        let content = tips.slice(1,-1).join("\n");

        let now = new Date;
        let data = {
          year:  now.getFullYear(),
          month: now.getMonth() + 1,
          day:   now.getDate(),
          title: title,
          content: marked(content)
        };

        write(config.templates.html, base, data);
      }
    });
  }
}

const write = function(template,path,data){
  let file = template.root + path.replace(/\.md$/, template.ext);
  ejs.renderFile(template.template, data, {}, function(err,str){
    if(err) {
      console.log(err);
    } else {
      mkdir(template.root, path.split("/").slice(0,-1));
      fs.writeFile(file, str, function(err){
        if(err) {
          console.log(err);
        }
      });
    }
  });
}

const mkdir = function(root,paths) {
  var tips = [];
  paths.forEach(function(tip){
    tips.push(tip);
    let path = root + tips.join("/");
    if(!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  });
}

watch.watchTree(config.root, config.options, function(file, current, previous){
  if(typeof file == "object" && previous === null && current === null) {
  } else if(previous === null) {
    // created
    template(file);
  } else if(current.nlink === 0) {
    // removed
    console.log("removed: ", file);
  } else {
    // changed
    template(file);
  }
});
