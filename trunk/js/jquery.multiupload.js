/*
 * jQuery Multiupload plugin
 * Version 1.0 (06/09/2008)
 * @requires jQuery v1.2.3 or later
 *
 * Examples at: http://code.google.com/p/jquerymultiupload/
 * Copyright (c) 2008 A. Beshkenadze
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * 
 */

(function($) {
if (/1\.(0|1|2)\.(0|1|2)/.test($.fn.jquery) || /^1.1/.test($.fn.jquery)) {
    alert('MultiUpload requires jQuery v1.2.3 or later!  You are using v' + $.fn.jquery);
	return;
}
// global $ methods for blocking/unblocking the entire page
$.multiUpload = function(options) {
	/*
	 * $.multiUpload.init.*
	 **********************/
	var vars = {
		file_place: '#files',
		browse_button:'#browse',
		upload_button:'#upload',
		max_file_size:20000,
		upload_url:'/upload.php',
		filter: ['image/jpg','image/jpeg','image/gif','image/png'],
		upload_after_select: false,
		factory: 'gears'
	};
	var opts = $.extend(vars, options);
	this.init = function(){
		if(!$.multiUpload.check(vars.file_place)){
			alert('Element '+vars.file_place+' not found.');
			return;
		}
		if(!$.multiUpload.check(vars.browse_button)){
			alert('Element '+vars.browse_button+' not found.');
			return;
		}
		if(!$.multiUpload.check(vars.upload_button)){
			alert('Element '+vars.upload_button+' not found.');
			return;
		}else{
			$(vars.upload_button).click(function(e){
				$.multiUpload.request.all();
			});
		}
		switch(vars.factory)
		{
		case 'gears':
			$.gears();
		  	break;
		default:
			alert('Factory not found');
			return;
		}
		if (!window.google || !window.google.gears) {
			var message = 'Install Gears for multiupload support.';
			var url = 'http://gears.google.com/?action=install' +
			'&message=' +
			encodeURIComponent(message) +
			'&return=' +
			encodeURIComponent(window.location.href);
			$(vars.browse_button).html('<u>Click to install ' +
			'Gears to enable multifile upload!</u>');
			$(vars.browse_button).bind('click',function(e){window.location.href=url})
			return false;
		}
		$(vars.browse_button).bind("click",function(e){
					$.multiUpload.browse();
		});
	}
	$.multiUpload.check = function(id){
		if($(id).length > 0){
			return true;
		}else{
			return false;
		}
	}
	$.multiUpload.browse = function () {
		var desktop = google.gears.factory.create('beta.desktop');
		desktop.openFiles(function(files){
			$.each(files,function(i,value){
				var count_id = $('.file').count()+1;
				$.multiUpload.file(count_id,value);
			})
		},{ filter: vars.filter });
	}
	/*
	 * $.multiUpload.file.*
	 ***********************/
	$.multiUpload.file = function(i,file){
		$.multiUpload.file.i = i;
		$.multiUpload.file.item = file;
		var fileinfo = $.multiUpload.func.getFileInfo();
		var element = $('<li/>')
		.attr('id','file_'+i)
		.html(fileinfo.name)
		.addClass('file')
		.addClass(fileinfo.ext)
		.appendTo($(vars.file_place));
		var check = $.multiUpload.func.checkFile();
		var status = $('<span/>')
			.attr('id','status_'+i)
			.addClass('status')
			.appendTo(element);
			if(check && !vars.upload_after_select){
			    $(status)
				.attr('title','File ready')
				.addClass('ready');
				var upload = $('<span/>')
				.bind('click',function(e){
					var i = $(this).attr('id').replace(/bind_/,'');
					$.multiUpload.request(i);
					$("#bind_"+i).remove();
					$("#del_"+i).remove();
					return false;
				})
				.addClass('upload')
				.attr('title','Upload file')
				.html('')
				.attr('id','bind_'+i)
				.appendTo(element);
			}else if(check && vars.upload_after_select) {
				$.multiUpload.request(i);
			}else{
				$(status)
				.addClass('error')
				.html($.multiUpload.file.error)
				.appendTo(element);
			}
			var del = $('<span/>')
			.bind('click',function(e){
				var i = $(this).attr('id').replace(/del_/,'');
				$('#file_'+i).remove();
				return false;
			})
			.addClass('remove')
			.attr('title','Remove file')
			.html('')
			.attr('id','del_'+i)
			.appendTo(element);
	};
	/*
	 * $.multiUpload.loader.*;
	 ****************/
	$.multiUpload.loader={};
	$.multiUpload.loader.start = function (i){
		var element = $('#file_'+i);
		if(i=='undefined')	var i = $.multiUpload.file.i;
		$.multiUpload.ajaxloader = $('<span/>').attr('id','loader_'+i).html('<img src="images/loader.gif" />').addClass('loader').appendTo(element);
	}
	$.multiUpload.loader.stop = function (i){
		if(i=='undefined')	var i = $.multiUpload.file.i;
		$('#loader_'+i).remove();
	}
	/*
	 * $.multiUpload.request
	 ***********************/
	$.multiUpload.request = function (i){
		var request = google.gears.factory.create('beta.httprequest');
		var file = $.multiUpload.file.item;
		$.multiUpload.request.i = i;
		$.multiUpload.request.status = $('#status_'+i);
		request.open('POST', vars.upload_url);
        request.setRequestHeader('name',file.name);
		$.multiUpload.loader.start(i);
        request.send(file.blob);
		request.upload.onprogress = function(req){
			//TODO: Fix percent
			//var percent = Math.round((req.loaded/req.total)*100);
			//var status = $.multiUpload.request.status;
			//$(status).html(percent+'%');
		};
		request.onreadystatechange = function() {
	        if (request.readyState == 4) {
				var status = $('#file_'+i+' .status');
				$(status).empty();
				$(status).addClass('ok')
				.removeClass('ready');
				$.multiUpload.loader.stop(i);
				$('#file_'+i).removeAttr('id');
	        }
        };
	}
	$.multiUpload.request.all = function(){
		var files = $('.ready');
		$('.upload').remove();
		$('.remove').remove();
		if($.multiUpload.check(files)){
			$.each(files,function(i,item){
				var i = $(item).parent().attr('id').replace(/file_/,'');
				$.multiUpload.request(i);
			});
		}
	}
	/* $.multiUpload.func
	 ***********************/
	$.multiUpload.func = {};
	$.multiUpload.func.checkFile = function (){
		try {
	      var size = $.multiUpload.file.item.blob.length;
		  if(size >= vars.max_file_size){
				$.multiUpload.file.error = 'file to large';
				return false;
		  }else{
		  	return true;
		  }
	    } catch (e) {
			$.multiUpload.file.error = 'file not found';
			return false;
	    }
	}
	$.multiUpload.func.getFileInfo = function () {
		var file = $.multiUpload.file.item;
		reWin = /.*\\(.*)/;
        var fileTitle = file.name.replace(reWin, "$1");
        reUnix = /.*\/(.*)/;
        fileTitle = fileTitle.replace(reUnix, "$1");
		var RegExExt =/.*\.(.*)/;
        var ext = fileTitle.replace(RegExExt, "$1");
		return file = {name:fileTitle,ext:ext}
	}
	jQuery.fn.count = function (){
		return $(this).length
	}
	this.init();
	return this;
};
})(jQuery);
