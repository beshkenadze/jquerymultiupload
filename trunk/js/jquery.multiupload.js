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
		abort_button:'#abort',
		max_file_size:20000,
		upload_url:'/upload.php',
		filter: ['image/jpg','image/jpeg','image/gif','image/png'],
		upload_after_select: false,
		factory: 'gears',
		serial:false
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
		if(!$.multiUpload.check(vars.abort_button)){
			alert('Element '+vars.abort_button+' not found.');
			return;
		}else{
			$(vars.abort_button).click(function(e){
				$.each($.multiUpload.obj.request,function(i,item){
					item.abort();
				})
			});
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
			if ($.gears.init()) {
				var init = true;
			}else{
				var init = false;
				$.gears.install();
				return;
			}
		  	break;
		default:
			alert('Factory not found');
			return;
		}
		alert(vars.browse_button);
		$(vars.browse_button).bind("click",function(e){
			$.multiUpload.browse();
		});
		if(!init){
			return false;
		}
	}
	$.multiUpload.check = function(id){
		if($(id).length > 0){
			return true;
		}else{
			return false;
		}
	}
	$.multiUpload.browse = function () {
		var desktop = $.gears.factory('beta.desktop');
		desktop.openFiles(function(files){
			$.each(files,function(i,value){
				var count_id = $('.file').count()+1;
				$.multiUpload.file(count_id,value);
				$.multiUpload.file.array[count_id]=value;
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
		.html('<span class="filename">'+fileinfo.name+'</span>')
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
					//$.multiUpload.request(i);
					$.multiUpload.request($.multiUpload.file.item,{
						element: $('#file_'+i),
						status: $('#status_'+i),
					});
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
				//$.multiUpload.request(i);
				$.multiUpload.request($.multiUpload.file.item,{
						element: $('#file_'+i),
						status: $('#status_'+i),
				});
			}else{
				$(status)
				.addClass('error')
				.html($.multiUpload.file.error)
				.appendTo(element);
			}
			if (!vars.upload_after_select) {
				var del = $('<span/>').bind('click', function(e){
					var i = $(this).attr('id').replace(/del_/, '');
					$('#file_' + i).remove();
					return false;
				}).addClass('remove').attr('title', 'Remove file').html('').attr('id', 'del_' + i).appendTo(element);
			}
	};
	$.multiUpload.file.array = new Array;
	/*
	 * $.multiUpload.loader.*;
	 ****************/
	$.multiUpload.loader={};
	$.multiUpload.loader.start = function (i){
		var element = $('#file_'+i);
		$('<span/>').width('0').attr('id','loader_'+i).addClass('loader').appendTo(element);
	}
	$.multiUpload.loader.stop = function (i){
		if(i=='undefined')	var i = $.multiUpload.file.i;
		$('#loader_'+i).remove();
	}
	/*
	 * $.multiUpload.request
	 ***********************/
	$.multiUpload.request = function(file,options){
		var vars = {
			element: $('#file_0'),
			status: $('#status_0'),
			upload_url:'upload.php',
			serial:false
		};
//		var file = $.multiUpload.file.array[i];
		var opts = $.extend(vars, options);
		var request = $.gears.factory('beta.httprequest');
		var i = $(vars.element).attr('id').replace(/file_/,'');
		if(!file){
			return;
		}
		$.multiUpload.obj.request[i]=request;
		$("#bind_"+i).remove();
		$("#del_"+i).remove();
		request.open('POST', vars.upload_url+"?name="+file.name);
		$.multiUpload.loader.start(i);
        request.send(file.blob);
		request.upload.onprogress = function(req){
			var percent = Math.round((req.loaded/req.total)*100);
			var filename = $(vars.status).parents().children('.filename');
			var total = filename.width()/100;
			var loader = $(vars.status).parents().children('.loader');
			//$(vars.status).html(percent+'%');
			loader.css('width',total*percent);
		};
		request.onreadystatechange = function() {
	        if (request.readyState == 4) {
				var link = request.responseText;
			//console.log(link);
				$(vars.status).empty();
				$(vars.status).addClass('ok')
				.removeClass('ready');
				//$.multiUpload.loader.stop(i);
				$(vars.element).removeAttr('id');
				var download = $('<a/>')
				.addClass('download')
				.attr('target','_blank')
				.attr('href',link)
				.attr('title','Download file')
				.appendTo(vars.element);
				if(vars.serial){
					if($(vars.element).next().count()){
						if($(vars.element).next().children('.ready')){
							$.multiUpload.request.all();
						}
					}
				}
	        }
        };
	};
	$.multiUpload.request.array = {};
	$.multiUpload.request.all = function(){
		var files = $('.ready');
		if($.multiUpload.check(files)){
			if(vars.serial){
				var i = $($(files[0]).parent()).attr('id').replace(/file_/,'');
				$.multiUpload.request($.multiUpload.file.array[i],{
					element: $(files[0]).parent(),
					status: $(files[0]),
					serial:vars.serial
				});
			}else{
				$.each(files,function(i,item){
					var i = $($(item).parent()).attr('id').replace(/file_/,'');
					$.multiUpload.request($.multiUpload.file.array[i],{
						element: $(item).parent(),
						status: $(item),
					});
				});
			}
		}
	}
	/* $.multiUpload.func
	 ***********************/
	$.multiUpload.obj={};
	$.multiUpload.obj.request = {};
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
	this.init();
	return $.multiUpload;
};
})(jQuery);
jQuery.fn.count = function (){
	return $(this).length
}