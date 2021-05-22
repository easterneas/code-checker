# Code Checker

Code Checker merupakan project berbasis Javascript yang memeriksa kemiripan antara 2 (atau lebih) string dari semua branch (kecuali branch `main`/`master`) pada repository yang dipilih.

Project ini juga memanfaatkan [Moss](https://theory.stanford.edu/~aiken/moss/) untuk opini kedua dalam pemeriksaan.

## Background

Repo ini merupakan kelanjutan dari repo Diffchecker Bot yang dikembangkan oleh [isrotrip](https://github.com/isrotrip), dibuat untuk mencari kemiripan di dalam kode yang dibuat oleh masing-masing student. Project ini semula dikembangkan dengan Javascript dan Python.

## Fitur

* Berbasis Javascript, menggunakan Dice's Coefficient untuk pembandingan antara 2 (atau lebih) string yang berbeda.
* Hampir seluruh prosesnya asynchronous, membuat proses menjadi cepat.
* Rasio yang dinormalisasi, ditarik dari `base_ratio` yang di-set pada file `config.js`.
* Moss file submition untuk opini kedua dari hasil pengecekan.

## Cara Kerja

Aplikasi ini memanfaatkan package [`string-similarity`](https://github.com/aceakash/string-similarity) yang menggunakan algoritma Dice's Coefficient, untuk membandingkan 2 atau lebih, string yang berbeda. Class Similarity Checker juga akan melakukan stripping terhadap comment yang tidak diperlukan, mengurangi noise dan meningkatkan akurasi ketika pembandingan berlangsung.

## Instalasi & Konfigurasi

Jalankan `npm i` terlebih dahulu untuk meng-install package yang

#### `config/config.js`

Ubah nama file `config.example.json` menjadi `config.js`, dan ubah konten sesuai kebutuhan:

``` js
{
  "batch_name": "batch-name", // nama angkatan/batcn/kelas
  "base_ratio": 0.8 // batas rasio minimum antara 0 dan 1. Default: 0.8
}
```

#### `moss`

[Daftar akun Moss baru](https://theory.stanford.edu/~aiken/moss/) untuk mendapatkan script yang dibutuhkan.

`tl;dr` \- Kirim email ke `moss@moss.stanford.edu` tanpa subjek seperti berikut:

``` sh
registeruser
mail <email_kamu@mail.com>
```

Ganti `email_kamu@mail.com` dengan email-mu, tanpa kurung siku.

Setelah beberapa saat, script akan dikirimkan dari Moss, berisikan script yang dibutuhkan, berikut dengan instruksinya. Tempatkan script dengan nama `moss` di direktori yang sama dengan `app.js`.

#### `config/valid-repositories.js`

Tambahkan repository yang valid dalam format array of objects seperti contoh berikut:

``` json
[
  {
    "name": "repository-kamu"
  }
]
```

**CATATAN**: Satu repository harus dibungkus dalam satu object.

Saat ini, setiap object hanya berisikan property `name`. Property lainnya akan ditambahkan di kemudian hari.

## Penggunaan

Jalankan `node app.js` untuk melihat daftar perintah yang bisa dijalankan:

``` md
Code Similarity Checker
Version 2.0

Usage

check repo-name <repo> [no-moss]
        Validates repository of a set organization,
        and checks for similarity for each branch(es).
        Submits 2 files to Moss by default, for second opinion.
        - repo-name <repo>      specifies repository name
        - [no-moss]             disables Moss checking
        - [min-ratio] <0-100>   filters normalized ratio

summarize repo-name <repository>
        Summarizes both local results and Moss results (if any).
        Won't summarize if there are no Moss results.
        - repo-name <repo>      specifies repository name
```

Daftar perintah saat ini:

* `node app.js check repo-name <repository> [no-moss]`

Perintah ini membutuhkan parameter `repo-name` yang lalu diikuti oleh nama repo yang dituju. Ketika selesai dijalankan, maka hasil bisa dilihat di direktori `results/<nama-organisasi>/<nama-repo>.json`

* `node app.js summarize repo-name <repository>`

Secara dasarnya, pengecekan tidak akan secara otomatis menggabungkan hasil dari lokal dan Moss, sehingga diperlukan langkah kedua ini. Perintah ini akan menggabungkan dua hasil, yang pertama merupakan hasil lokal, dan yang kedua merupakan hasil dari Moss.

Seperti perintah sebelumnya, perintah `summarize` membutuhkan parameter `repo-name`, diikuti oleh nama repo yang dituju pada nama organisasi yang sudah di-set di `config.js`. Hasilnya bisa dilihat di direktori `results/merged/<nama-repo>.json`

## Kontribusi

Dengan senang hati kontribusi dibuka untuk umum! Kamu cukup melakukan kontribusi dengan membuat pull request pada menu [Pull Requests](/pulls), dan detilkan kontribusi apa yang kamu sudah lakukan pada branch kamu.

## Issue?

Adakah issue ketika menjalankan aplikasi ini? Jika ya, kamu bisa buka thread issue baru pada menu [Issues](/issues).