# Ruby で自動テスト
<a id="top"></a>

クラスやテストを変更した時に自動でテストが走るようにする。

###### CONTENTS

1. [filewatcher のインストール](#install-filewatcher)
1. [rake タスクの定義](#define-rake-task)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [Rakefile](#example-rakefile)


###### ENVIRONMENTS

- Ruby : 2.6.2


<a id="install-filewatcher"></a>
### filewatcher のインストール

ファイルの変更によってコマンドを実行したい。
以前は `guard` を使用していたが、 `guard-minitest` がメンテナンスされていないので代わりのものを探した。

検索したら [filewatcher](https://github.com/filewatcher/filewatcher) がすぐ出てきて操作も簡単なので、他は見ていないがこれを選択した。

```ruby
# Gemfile
gem "filewatcher"
```

以下のコマンドで自動テストが実行できる。

```bash
$ filewatcher 'test/**/*_test.rb' 'ruby -Ilib:test $FILENAME'
```


[TOP](#top)
<a id="define-rake-task"></a>
### rake タスクの定義

rake タスクとして定義することで実行するコマンドをファイル名から構築できるようになる。

以下のようなタスクを定義すると `rake watch` で自動テストが開始する。

```ruby
task :watch do
  require "filewatcher"
  Filewatcher.new(["test/**/*_test.rb"]).watch do |filename,event|
    ruby "-Ilib:test #{filename}"
  end
end
```


[TOP](#top)
<a id="postscript"></a>
### まとめ

Ruby で自動テストを行う方法をまとめた。
簡単なコマンドで実現できて満足。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [filewatcher/filewatcher : GitHub](https://github.com/filewatcher/filewatcher)
- [ruby/rake : GitHub](https://github.com/ruby/rake)


[TOP](#top)
<a id="example-rakefile"></a>
#### Rakefile

実際に使用している Rakefile を載せておく。

test だけではなく lib も監視して、対応するテストが書いてあれば実行する構成。

```ruby
require "rake/testtask"

Rake::TestTask.new do |test|
  test.pattern = "test/**/*_test.rb"
end

task :watch do
  require "filewatcher"
  Filewatcher.new(["test/**/*_test.rb","lib/**/*.rb"]).watch do |filename,event|
    relative = filename.split(Dir.pwd).last

    if relative.start_with?("/lib/")
      filename = File.join [Dir.pwd, relative.gsub(%r{^/lib/},"test/").gsub(%r{\.rb},"_test.rb")]
    end

    if File.exist?(filename)
      ruby "-Ilib:test #{filename}"
    end
  end
end
```


[TOP](#top)
