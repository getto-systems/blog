var gulp = require("gulp");

var path = {
  root: "public/",
  html: "public/**/*.html",
  md: "src/**/*.md"
};

gulp.task("build", function(){
  gulp.src(path["md"])
    .pipe( require("gulp-plumber")() )
    .pipe( require("gulp-front-matter")({remove: true}) )
    .pipe( require("gulp-textlint")({formatterName: "pretty-error"}) )
    .pipe( require("gulp-markdown")() )
    .pipe( require("gulp-layout")(function(file){
      var params = file.frontMatter;
      params.layout = "template/hatena.jade";

      var now = new Date;
      params.year = now.getFullYear();
      params.month = now.getMonth() + 1;
      params.day = now.getDate();
      return params;
    }) )
    .pipe( gulp.dest(path["root"]) );
});

gulp.task("livereload", function(){
  gulp.src(path["root"])
    .pipe( require("gulp-server-livereload")({
      host: "0.0.0.0",
      livereload: {enable: true, port: process.env.LABO_PORT_PREFIX + "29"},
      open: true
    }) );
  gulp.watch(path["md"],["build"]);
});
