var gulp = require("gulp");
var connect = require("gulp-connect");

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
      var now = new Date;
      params["year"] = now.getFullYear();
      params["month"] = now.getMonth() + 1;
      params["day"] = now.getDate();
      return params;
    }) )
    .pipe( gulp.dest(path["root"]) );
});

gulp.task("html", function(){
  gulp.src(path["html"])
    .pipe( connect.reload() )
});

gulp.task("livereload", function(){
  connect.server({
    port: 8000,
    root: path["root"],
    livereload: true
  });
  gulp.watch(path["md"],["build"]);
  gulp.watch(path["html"],["html"]);
});
