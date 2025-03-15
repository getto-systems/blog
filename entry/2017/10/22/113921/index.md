---
title: Ruby でエクセルファイルを読み込む
---
<a id="top"></a>

* Ruby でエクセルファイルを読み込みたい

###### CONTENTS

1. [Roo を使用してエクセルファイルを読み込む](#read-by-roo)
1. [ハッシュでヘッダを指定](#detect-header-by-hash)
1. [配列でヘッダを指定](#detect-header-by-array)
1. [xls 型式のファイルを読み込む](#read-xls)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [ExcelParser](#excel-parser)


<a id="read-by-roo"></a>
### Roo を使用してエクセルファイルを読み込む

エクセルを読む gem は色々とあるが、今回は Roo を使用することにした。

* [roo-rb/roo : GitHub](https://github.com/roo-rb/roo)

基本的には以下のようにすれば良い。

```ruby
require "roo"

xlsx = Roo::Excelx.new("sheet.xlsx")
xlsx.sheet("Sheet1").each do |row|
  row[0] # => first cell
end
```

each にオプションを渡すことで、特定の行をヘッダとして解釈して Hash として行を取り出すこともできる。


[TOP](#top)
<a id="detect-header-by-hash"></a>
### ハッシュでヘッダを指定

ヘッダ行の値に重複がない場合は、 Hash でヘッダのキーを指定できる。

```ruby
header = {
  item_name: "商品名",
  item_price: "価格",
}

sheet = xlsx.sheet("Sheet1")
sheet.each(header) do |row|
  if row != header
    row[:item_name] # => 「商品名」のセル
  end
end
```

each の中にはヘッダ行も渡される。


[TOP](#top)
<a id="detect-header-by-array"></a>
### 配列でヘッダを指定

ヘッダ行として使用する行の中に重複する値をもつセルがある場合、 Hash で指定する方法は使用できない。
（最初に現れた方の値になる）

配列で指定する方法は Roo では提供されていないので、自前で用意する。

```ruby
header = [
  [:data1, "データ"],
  [:data2, "データ"],
  [:data3, "データ"],
  [:data4, "データ"],
]

map = nil
sheet.each do |row|
  unless map
    map = to_header_map(row)
  else
    data = map.map{|i,key| [key,row[i]]}.to_h
    data[:data1] # => 最初の「データ」
  end
end
unless map
  raise Roo::HeaderRowNotFoundError
end


def to_header_map(row)
  header_index = 0
  map = nil
  row.each_with_index do |value,i|
    if header_match?(@header[header_index].last,value)
      map ||= []
      map << [i,@header[header_index].first]
      header_index += 1
    end
  end
  map
end
def header_match?(title,value)
  if title.start_with?("~")
    Regexp.new(title[1..-1]).match?(value)
  else
    title == value
  end
end
```


[TOP](#top)
<a id="read-xls"></a>
### xls 形式のファイルを読み込む

roo-xls を使用することで、同じ API で xls 形式のファイルを読み込むことができる。

* [roo-rb/roo-xls : GitHub](https://github.com/roo-rb/roo-xls)

```ruby
require "roo"
require "roo-xls"

xls = Roo::Excel.new("sheet.xls")
xls.sheet("Sheet1").each do |row|
  row[0] # => first cell
end
```


[TOP](#top)
<a id="postscript"></a>
### まとめ

roo を使用することで xlsx や xls ファイルを、同じ API で読むことができる。
（この記事では紹介しなかったが、 Google Spreadsheet も読める模様）


[TOP](#top)
<a id="reference"></a>
### 参考資料

* [roo-rb/roo : GitHub](https://github.com/roo-rb/roo)


[TOP](#top)
<a id="excel-parser"></a>
#### ExcelParser 全体

```rb
class ExcelParser
  def initialize(file:,sheet:,header:,require_cols:,exclude_data:)
    @sheet = parser(file).sheet(sheet)
    @header = header
    @require_cols = require_cols
    @exclude_data = exclude_data
  end
  def each(&block)
    case @header
    when Hash
      @sheet.each(@header) do |data|
        if data != @header
          out data, block
        end
      end
    when Array
      map = nil
      @sheet.each do |row|
        unless map
          map = to_header_map(row)
        else
          data = map.map{|i,key| [key,row[i]]}.to_h
          out data, block
        end
      end
      unless map
        raise Roo::HeaderRowNotFoundError
      end
    end
  end

  private

    def parser(input)
      case File.extname(input)
      when ".xls"
        Roo::Excel
      else
        Roo::Excelx
      end.new(input)
    end

    def to_header_map(row)
      header_index = 0
      map = nil
      row.each_with_index do |value,i|
        if header_match?(@header[header_index].last,value)
          map ||= []
          map << [i,@header[header_index].first]
          header_index += 1
        end
      end
      map
    end
    def header_match?(title,value)
      if title.start_with?("~")
        Regexp.new(title[1..-1]).match?(value)
      else
        title == value
      end
    end

    def out(data,block)
      if isValidData?(data)
        block.call(data)
      end
    end

    def isValidData?(data)
      if !@require_cols || !@require_cols.all?{|col| data[col]}
        return false
      end
      if (@exclude_data || []).any?{|k,v| data[k] == v}
        return false
      end
      return true
    end
end
```

[TOP](#top)
