var gulp = require("gulp");
var connect = require("gulp-connect");

gulp.task("build", function(){
  return gulp.src("src/**/*.md")
    .pipe( require("gulp-front-matter")({"remove": true}) )
    .pipe( require("gulp-plumber")() )
    .pipe( require("gulp-textlint")() )
    .pipe( require("gulp-markdown")() )
    .pipe( require("gulp-layout")(function(file){
      var params = file.frontMatter;
      var now = new Date;
      params["year"] = now.getFullYear();
      params["month"] = now.getMonth() + 1;
      params["day"] = now.getDate();
      return params;
    }) )
    .pipe( gulp.dest("public/") );
});

gulp.task("html", function(){
  gulp.src("public/**/*.html")
    .pipe( connect.reload() )
});

gulp.task("livereload", function(){
  connect.server({
    port: 8000,
    root: "public/",
    livereload: true
  });
  gulp.watch("src/**/*.md",["build"]);
  gulp.watch("public/**/*.html",["html"]);
});
