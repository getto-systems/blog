---
title: Ruby でバーコードを生成する
---
<a id="top"></a>

- バーコードスキャナーで読み取れるバーコードを生成したい
- 生成するバーコードは１次元のもので良い

###### CONTENTS

1. [barby を使用してバーコードを生成](#generate-barcode-by-barby)
1. [Code 128 について](#code-128)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="generate-barcode-by-barby"></a>
### barby を使用してバーコードを生成

[barby](https://github.com/toretore/barby) を使用してバーコードを生成する。

```ruby
require "barby/barcode/code_128"
require "barby/outputter/png_outputter"

barcode = Barby::Code128B.new("barcode data")
File.open("barcode.png", "wb") do |f|
  f.write Barby::PngOutputter.new(barcode).to_png(xdim: 1, height: 40, margin: 0)
end
```

この例では、 Code128B を使用して `barcode data` という文字列をバーコード化している。

Code128 にはバーコード化の方式が A, B, C の３種類ある。

今回は Code B の方式のみ使用したので、そのコード例のみ掲載した。


[TOP](#top)
<a id="code-128"></a>
### Code 128 について

アスキーコードの 128 文字全てをバーコード化できるのが Code 128 という規格。

A, B, C の３種類の方式がある。
これらは１つのバーコードの中でも、途中で変えることが可能。

#### Code A

数字、記号とアルファベット大文字に加えて、制御文字をバーコード化できる。

#### Code B

数字、記号と、アルファベットの大文字、小文字をバーコード化できる。

#### Code C

数字のみバーコード化できる。
２桁の数字をまとめてバーコード化するので、桁数の多い数字なら短いバーコードで表現することができる。

#### GS1-128

企業間で情報をやり取りするために、 GS1-128 というものもある。

バーコード化の方式は Code 128 と同じだが、梱包番号や入り数などのデータの配置方法を決めているもの。
これを参考にバーコード化のやり方を決めることで、企業間のやり取りをスムーズにしよう、ということ。


[TOP](#top)
<a id="postscript"></a>
### まとめ

[barby](https://github.com/toretore/barby) を使用することで、簡単にバーコードが出力可能だ。
Code 128 は高い印刷精度が要求されるとのことだが、自宅のインクジェットプリンターでも読み取り可能なバーコードを印刷できた。

シールに印刷して貼り付けたり、伝票に印刷したりと、バーコードを利用して色々効率化を考えることができそうだ。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [toretore/barby : GitHub](https://github.com/toretore/barby)
- [CODE128とGS1-128 | バーコード講座 | キーエンス](https://www.keyence.co.jp/ss/products/autoid/codereader/basic_code128.jsp)

[TOP](#top)
