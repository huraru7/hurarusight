---
id: "900"
slug: zz-test
title: 表示確認用のテスト記事
unlisted: true
description: 画像・コード・リンクカードなどの表示確認用です。
date: "2026-10-05"
---

## リンク

文中のURL https://example.com はそのままリンクになる。

URLだけの行はカードになる。

https://portfolio.huraru.com

[文字つきリンク](https://docs.astro.build/) は通常のリンク。

取得できないURLは通常のリンクのまま。

https://nonexistent.invalid/foo

## 画像

![ふらるのアイコン](/profile-icon.png)

画像の下の文章。

## コードブロック

文中の `inline code` はこう見える。

```cs
public class Player : MonoBehaviour
{
    [SerializeField] private float speed = 5f;

    private void Update()
    {
        var x = Input.GetAxis("Horizontal");
        transform.Translate(x * speed * Time.deltaTime, 0, 0);
    }
}
```

```ts
const sum = (a: number, b: number): number => a + b;
console.log(sum(1, 2)); // とても長い行はここで横スクロールになるはず…………………………………………………………………………………………………
```

```
言語指定なしのブロックはこうなるよ
```

## そのほか

> 引用文はこんなかんじ

- 箇条書き
- 2つ目

1. 番号付き
2. 2つ目

| 列A | 列B |
| --- | --- |
| 1   | 2   |

**太字** と _斜体_ と ~~打ち消し~~

## 改行

1行目
2行目(単一の改行)
3行目

空行をはさむと段落が分かれる。

## サブテキスト

-# これは薄く小さい文字(-# の記法)
通常の文章はこう見える。

-# 2行にわたる場合
-# 2行目もここに続く

`-#` は文中に書いても、ただの文字のまま。 -# ここは変換されない
