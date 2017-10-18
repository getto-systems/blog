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

1. [ExcelParser](#parser)


<a id="read-by-roo"></a>
### Roo を使用してエクセルファイルを読み込む

エクセルを読む gem は色々とあるが、今回は Roo を使用することにした。

- [roo-rb/roo : GitHub](https://github.com/roo-rb/roo)


[TOP](#top)
<a id="detect-header-by-hash"></a>
### ハッシュでヘッダを指定


[TOP](#top)
<a id="detect-header-by-array"></a>
### 配列でヘッダを指定


[TOP](#top)
<a id="read-xls"></a>
### xls 型式のファイルを読み込む


[TOP](#top)
<a id="postscript"></a>
### まとめ


[TOP](#top)
<a id="reference"></a>
### 参考資料

* [roo-rb/roo](https://github.com/roo-rb/roo)


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
