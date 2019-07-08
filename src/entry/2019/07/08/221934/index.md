# 普通のコマンドみたいに docker run を起動する
<a id="top"></a>

処理の実体を docker run でコンテナの中に委譲するスクリプトを普通のコマンドみたいな使用感にしたい。

###### CONTENTS

1. [出来上がったもの](#outcome)
1. [通常の呼び出し](#normal)
1. [標準入力をパイプラインにする](#pipe-stdin)
1. [標準出力をリダイレクト](#redirect-stdout)
1. [標準エラーをリダイレクト](#redirect-stderr)
1. [端末を割り当てる](#allocate-tty)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Docker version 18.09.7


<a id="outcome"></a>
### 出来上がったもの

```bash
#!/bin/bash

if [ -t 0 ] && [ -t 1 ] && [ -t 2 ]; then
  docker run --rm -it -a stdin -a stdout -a stderr buildpack-deps:disco bash "$@"
else
  docker run --rm -i -a stdin -a stdout -a stderr buildpack-deps:disco bash "$@"
fi
```

`-a` で、標準入力、標準出力、標準エラーをコンテナにアタッチする。

- 標準入力、標準出力、標準エラーが端末なら `-it` で `docker run`
- そうでないなら `-i` で `docker run`

このスクリプトを `docker-bash.sh` として保存してあることにして説明していく。


[TOP](#top)
<a id="normal"></a>
### 通常の呼び出し

単にコマンドを発行してみる。

```
$ ./docker-bash.sh -c 'echo "hello, world!"'
hello, world!
```

`bash -c 'echo "hello, world!"'` がコンテナで実行され、その結果が標準出力に出力された。


[TOP](#top)
<a id="pipe-stdin"></a>
### 標準入力をパイプラインにする

```
$ cat hello.sh
echo "hello, world!"

$ cat hello.sh | ./docker-bash.sh
hello, world!
```

標準入力をパイプで繋げて起動すると、`bash` に入力が渡され、その結果が標準出力に出力された。


[TOP](#top)
<a id="redirect-stdout"></a>
### 標準出力をリダイレクト

```
$ ./docker-bash.sh -c 'echo "hello, world!"' > hello.txt
$ cat hello.txt
hello, world!
```

`bash -c 'echo "hello, world!"'` がコンテナで実行され、その結果が `hello.txt` にリダイレクトされた。


[TOP](#top)
<a id="redirect-stderr"></a>
### 標準エラーをリダイレクト

```
$ ./docker-bash.sh -c '>&2 echo "hello, error!"; echo "hello, world!"' 2> error.txt
hello, world!

$ cat error.txt
hello, error!
```

エラーが `error.txt` にリダイレクトされた。


[TOP](#top)
<a id="allocate-tty"></a>
### 端末を割り出てる

```
$ ./docker-bash.sh
root@bd2f729fddc5:/#

```

コンテナで bash が起動して端末が割り出てられた。


[TOP](#top)
<a id="postscript"></a>
### まとめ

bash を起動するのはコンテナの中にしつつ、スクリプトとしては通常のコマンドのように動作するスクリプトの書き方をまとめた。

この記事では buildpack-deps:disco イメージで bash を起動しているが、任意のイメージで任意のコマンドを動かせる。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [docker run --attach | Docker Docs](https://docs.docker.com/v17.12/engine/reference/commandline/run/#attach-to-stdinstdoutstderr--a)


[TOP](#top)
