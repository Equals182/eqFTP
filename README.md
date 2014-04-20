eqFTP
=====

FTP integration for Brackets code editor.

This extension brigs simple FTP support to Brackets.
Here's some features:

* FTP File Manager -- You can explore your remote server
* Downloading -- On double click you can download file to edit
* Uploading -- You can upload files on save
* FTP Connection Manager -- You can manage all your connections in single window

This extension created on base of https://github.com/theproducer/brackets-ftp. Actually I rewrote almost everything, but still.

## Please Note

This extension _does not support any type of encryption_ so all your settings and data including passwords will be stored as plain text. You can change folder where your passwords will be stored or improve this extension somehow.

## Current State

This extension was inspired by Dreamweaver's FTP implementation. First you create new connection in manager, next you connect, download file, edit, save and it's uploads automatically.

It's really basic and I hope you'll enjoy this extension.

## What's next

Well first of all I'd like to say I did this extension because I needed it. I will add new features if I'll need them or if you will pull request them.

You can fork this stuff and change it however you want.

I'm thinking about this:

* SFTP -- well, this feature is dead now
* Sync -- down/uploading whole things in both ways
* Queue -- you will be able to save bunch of files and then - BAM! Upload them!
* Folder Choosing Dialog for every input that needs it

## License

MIT-licensed -- see main.js for details.
