var spacerImageUrl = "/images/spacer.gif";
jQuery.support.cors = true;
var $pageTools;
var $slidingPageTools;
var $layoutWrapper;
var resizeTimeout;
var scrollTimeout;

// insertTextAtCursor
function insertTextAtCursor(textBox, textValue) {
	if (document.selection) {  // older IE
		textBox.focus();
		sel = document.selection.createRange();
		sel.text = textValue;
	}
	else if (textBox.selectionStart || textBox.selectionStart == '0') {  // not older IE
		var startPos = textBox.selectionStart;
		var endPos = textBox.selectionEnd;
		textBox.value = textBox.value.substring(0, startPos)
				+ textValue
				+ textBox.value.substring(endPos, textBox.value.length);
	}
	else {
		textBox.value += textValue;
	}
}

// convertJsonToSelectOptions
function convertJsonToSelectOptions(json, $selectBox, idPropertyName, titlePropertyName, initialItemText) {
	// createOptionText utility functino
	function createOptionText(value, text) {
		return '<option value="' + value + '">' + text + '</option>'
	}

	// requires array with 'id' and 'title'
	if (json.length == 0) {
		return;
	}
	var optionString = '';
	//if (initialItemText && (json.length > 1)) {
	if (initialItemText) {
		optionString += createOptionText('-1', '< ' + initialItemText + ' >');
	}
	for (var i = 0; i < json.length; i++) {
		optionString += createOptionText(json[i][idPropertyName], json[i][titlePropertyName]);
	}
	$selectBox.append($(optionString));
}

// supportsLocalStorage
function supportsLocalStorage() {
	return ('localStorage' in window) && window['localStorage'] !== null;
}

// createDelayManager
function createDelayManager() {
	var timer = 0;
	return function (callback, ms) {
		clearTimeout(timer);
		timer = setTimeout(callback, ms);
	};
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this, args = arguments;
		var later = function () {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

// browserIsIE
function browserIsIE() {
	return (navigator.userAgent.indexOf("MSIE") != -1) || (navigator.userAgent.indexOf("Trident") != -1);
}
var galleriaLoaded = false;

// loadGalleria
function loadGalleria(themeName) {
	if (galleriaLoaded) {
		return true;
	}

	var themeFile;
	if (themeName == 'clubexpress') {
		themeFile = '/script/galleria/themes/clubexpress/galleria.clubexpress.js?v=20130808';
	}
	else {
		themeFile = '/script/galleria/themes/twelve/galleria.twelve.min.js?v=20130808';
	}
	$.ajax({
		url: "/script/galleria/galleria-min.js",
		dataType: "script",
		cache: true,
		async: false,
		success: function () {
			galleriaLoaded = true;
			window.setTimeout(function () {
				Galleria.loadTheme(themeFile);
			}, 200);
		}
	});
}

var firstTimeout = true;
var $timeoutDialog;

// displayTimeoutWarning
function displayTimeoutWarning(timeoutPeriod) {
	if (window != window.top) {
		window.top.displayTimeoutWarning(timeoutPeriod);
		return;
	}
	if (firstTimeout) {
		refreshSession(timeoutPeriod);
		firstTimeout = false;
		return;
	}
	if (!$timeoutDialog) {
		var timeoutWarningHtml =
			'<div><div class="message">Your web session will expire in a few minutes. Click the "Refresh" button to keep it active.</div> \
			<div class="button-panel" style="text-align:center;margin:auto;padding-top:5px;"><a href="#" onclick="refreshSession(' + timeoutPeriod + '); return false;" class="ce-button">Refresh</a></div></div>'
		$timeoutDialog = $(timeoutWarningHtml);
	}
	$timeoutDialog.dialog({"title":"Session Timeout", "autoOpen":true, "resizable": false});
}

// refreshSession
function refreshSession(timeoutPeriod) {
	if ($timeoutDialog) {
		$timeoutDialog.dialog('close');
	}
	$.get("refresh.ashx", function (data) {
		if (data == "1") {
			window.setTimeout(function () { displayTimeoutWarning(timeoutPeriod) }, timeoutPeriod);
		}
		else {
			alert("Sorry, your session expired and could not be refreshed");
		}
	});
}

// handleTimeout
function handleTimeout() {
	window.top.location.replace("http://" + window.top.location.hostname + window.top.location.pathname);
}

// validateAndPostBack
function validateAndPostBack(controlName, postBackArgument) {
	if (validatePage()) {
		__doPostBack(controlName, postBackArgument);
	}
}

// validatePage
function validatePage() {
	if (typeof (DES_ValidateGroup) == 'function') {
		return DES_ValidateGroup("*");
	}
	// should never get to the else - left here just in case we missed something
	else {
		if (typeof (Page_ClientValidate) == 'function') {
			Page_ClientValidate();
			return Page_IsValid;
		}
		else {

			if (typeof (VAM_ValOnClick) == 'function') {
				VAM_ValOnClick('', '');
				return VAM_ValOnSubWGrp('*');
			}
		}
	}
	return true;
}

// alignWithInstructionText
function alignWithInstructionText(selector) {
	$(selector).css("margin-left", $(".instruction-text").css("margin-left"));
}

var modalPopupArray;
var popupNumber = 0;
if (window == window.top) {
	modalPopupArray = new Array();
}

// popupinfo properties (elements of modalPopupArray):
// * $dialog - reference to div for jquery dialog
// * $widget - dialog("widget") result
// * number - popup number - should be the position in the array
// * iframeName - the name attribute of the iframe - for use in window.frames[]
// * dialogId - the id of the dialog wrapper before calling 'dialog'
// * setupComplete - has the popup been set up - has the title been set and the help link adjusted
// * opener - the window which opened the popup - could be top, or another popup
// * pageId - the page id from the url - set by the popup call back
// * popupWidth/popupHeight - the original width and height

// closeModalPopup
// closes the last popup on the list
function closeModalPopup() {
	if (window != window.top) {
		window.top.closeModalPopup();
		return;
	}
	var popupInfo = getModalPopupInfo();
	if (popupInfo.onClose) {
		popupInfo.onClose();
	}
	window.top.modalPopupArray.pop();
	popupInfo.$dialog.dialog("option", "beforeClose", null);

	$("#" + popupInfo.iframeName).remove();
	popupInfo.$dialog.dialog("close");
	popupInfo.$dialog.dialog("destroy");
	popupInfo.$dialog.remove();
}

// getOpener
// get 'opener' for most recent modal popup - top of stack
function getOpener() {
	if (window != window.top) {
		return window.top.getOpener();
	}

	var lastPopup = getModalPopupInfo();
	return lastPopup.opener;
}

// getModalPopupInfo
// get popupInfo for most recent modal popup - top of stack
function getModalPopupInfo() {
	if (window != window.top) {
		return window.top.getModalPopupInfo();
	}
	return window.top.modalPopupArray[modalPopupArray.length - 1];
}

// setupModalPopup
// set title and help link, return opener
function setupModalPopup(title, pageId) {
	if (window != window.top) {
		return window.top.setupModalPopup(title, pageId);
	}
	var popupInfo = getModalPopupInfo();
	if (!popupInfo) {
		return;
	}
	popupInfo.pageId = pageId;
	if (!popupInfo.setupComplete) {

		$("#title_box", popupInfo.$widget).html(title);
		if (modalPopupArray.length == 1) {
			popupInfo.opener = window.top;
		}
		else {
			popupInfo.opener = window.frames[modalPopupArray[modalPopupArray.length - 2].iframeName].window;
		}

		popupInfo.setupComplete = true;
	}
	popupInfo.$dialog.dialog("open");
	return popupInfo;
}

// hidePopupHelpLink
function hidePopupHelpLink() {
	$("#help_box", getModalPopupInfo().$widget).hide();
}

// modalPopupPostback
function modalPopupPostback() {
// ********* do we need this???
}

// openPopup
// obsolete - use openModalPopup or openNonModalPopup
// doing only modal for now
// popupName and useScrollBar parameters are no longer used
function openPopup(popupUrl, popupName, popupWidth, popupHeight, modal, useScrollBar) {
	openModalPopup(popupUrl, popupWidth, popupHeight, "");
}

// openModalPopup
function openModalPopup(popupUrl, popupWidth, popupHeight, title, resizable, dialogClass, allowFullScreen, hidePrintLink) {
	if (window != window.top) {
		window.top.openModalPopup(popupUrl, popupWidth, popupHeight, title, resizable, dialogClass);
		return;
	}

	if (!title) {
		title = "";
	}
	if (resizable !== false) {
		resizable = true;
	}
	popupNumber += 1;
	var popupIframeName = 'popup_iframe' + popupNumber;
	var popupDialogId = "popup_dialog" + popupNumber;
	var popupHtml = "<div id='" + popupDialogId + "' class='popup-dialog-content' ><iframe frameborder='0' " + (allowFullScreen ? "allowfullscreen='true' " : '') + "name='" + popupIframeName + "' id='" + popupIframeName + "' class='popup-iframe' src='" + popupUrl + "'></iframe></div>";
	var $popup = $(popupHtml);
	var newPopupInfo = { $dialog: $popup, number: popupNumber, iframeName: popupIframeName, dialogId: popupDialogId, setupComplete: false, "popupWidth": popupWidth + 25, "popupHeight": popupHeight + 40 };
	modalPopupArray.push(newPopupInfo);

	var printBoxHtml = "";//hidePrintLink ? "" : "<div id='print_box' title='Print' iframe_name='" + popupIframeName + "'></div>";
	var maximizeBoxHtml = "";
	if (popupWidth > 350) {
		maximizeBoxHtml = "<div id='max_box' title='Maximize'></div>";
	}

	var helpBoxHtml = "<div id='help_box' title='Help'></div>";

	var titleHtml = "<div><div id='title_box'>" + title + "</div>" + maximizeBoxHtml + "</div>" + helpBoxHtml + printBoxHtml + "<div class='clear'></div>	</div>"
	showPopup(newPopupInfo.$dialog, popupWidth, popupHeight, true, titleHtml, dialogBeforeClose, resizable, dialogClass, popupIframeName);
	newPopupInfo.$widget = newPopupInfo.$dialog.dialog("widget");
}

// showPopup
// this should never be called directly
function showPopup($popup, popupWidth, popupHeight, modal, title, beforeCloseFunction, resizable, dialogClass, popupIframeName) {
	var initialOptions = {
		'dialogClass': 'popup-dialog-wrapper' + (dialogClass ? ' ' + dialogClass : ''),
		'width': popupWidth,
		'height': popupHeight,
		'title': '',
		'modal': modal,
		'beforeClose': beforeCloseFunction,
		'resizable': resizable,
		'autoOpen': false,
		'draggable': true,
		'closeText': "Close",
		"position": { my: "center center", at: "center center-10%", of: window },
		"maximized": false,
		'open': function () {
			attachPopupClickHandlers($popup.dialog("widget"), popupIframeName);
			//$("body").css("overflow", "hidden");
		}
	};

	var dialog = $popup.dialog(initialOptions);
	setHtmlDialogTitle(title, dialog);
}
// setHtmlDialogTitle
function setHtmlDialogTitle(htmlTitle, $dialog) {
	if (!$dialog) {
		$dialog = getModalPopupInfo().$dialog;
	}
	$dialog.data("uiDialog")._title = function (title) {
		title.html(this.options.title);
	};
	$dialog.dialog('option', 'title', htmlTitle);
}

// attachPopupClickHandlers
function attachPopupClickHandlers(dialogWidget, popupIframeName) {
	$("#max_box", dialogWidget).unbind().click(function () {
		maximizeDialog();
	});
	$("#help_box", dialogWidget).click(function () {
		showHelpForPopup();
	});
	//$("#print_box", dialogWidget).unbind().click(function () {
	//	printIframeDialog(popupIframeName);
	//});
}

// showHelpForPopup
// should be called *only* by the standard popup help link
function showHelpForPopup() {
	showHelp(getModalPopupInfo().pageId);
}

// showHelp
// called by showHelpForPopup and pages which need to show help without using a HelpLink
function showHelp(helpId) {
	if (!helpId) {
		helpId = pageId;
	}
	var win = window.open(helpUrlBase + helpId, "ce_help", "", true);
	win.focus();
}

// showHelpPopup
// used only for vcard, vcal, cvv, and other little help popups
function showHelpPopup(url, width, height) {
	if (!width) {
		width = 400;
	}
	if (!height) {
		height = 600;
	}
	var popupHtml = "<div class='help-dialog'><iframe class='popup-iframe' name='help_iframe' id='help_iframe' src='" + url + "' height='98%' width='98%'></iframe></div>";
	var $helpPopup = $(popupHtml);
	var titleHtml = "<div><div id='title_box'>Help</div><div class='clear'></div></div>"

	showPopup($helpPopup, width, height, false, titleHtml, null, true, 'help', 'help_iframe');
	$helpPopup.dialog("open");
	$helpPopup.dialog("moveToTop");
}

// resizeDialog
function resizeDialog(newWidth, newHeight) {
	var popupInfo = getModalPopupInfo();
	var $popup = popupInfo.$dialog;

	$popup.dialog("option", "width", newWidth);
	//var currentStyle = $popup.attr('style');
	//currentStyle = currentStyle.replace(/height:\s*(\d*)/, 'height:' + newHeight);
	$popup.dialog("option", "height", newHeight + 20);
	//$popup.attr('style', currentStyle);
	$popup.dialog("option", "position", { my: "center center", at: "center center-10%" });
}

// resizeDialogBy
function resizeDialogBy(widthChange, heightChange) {
	var popupInfo = getModalPopupInfo();
	var $popup = popupInfo.$dialog;
	var newWidth = $popup.dialog("option", "width") + widthChange;
	var newHeight = $popup.dialog("option", "height") + heightChange;
	$popup.dialog("option", "width", newWidth);
	$popup.dialog("option", "height", newHeight);
	$popup.dialog("option", "position", { my: "center center", at: "center center-10%" });
}

// fitDialog
function fitDialog(options) {
	if (!options) {
		options = {};
	}
	if (!options.$widthElement) {
		options.$widthElement = $("form");
	}
	if ((options.widthAdjustment !== 0) && (!options.widthAdjustment)) {
		options.widthAdjustment = 10;
	}
	if (!options.$heightElement) {
		options.$heightElement = options.$widthElement;
	}
	if ((options.heightAdjustment !== 0) && (!options.heightAdjustment)) {
		options.heightAdjustment = 40;
	}
	resizeDialog(options.$widthElement.width() + options.widthAdjustment, options.$heightElement.height() + options.heightAdjustment);
}

// maximizeDialog
function maximizeDialog() {
	var popupInfo = getModalPopupInfo();
	var $popup = popupInfo.$dialog;
	var currentOptions = $popup.dialog("option");
	var $maxBox;

	if (currentOptions.maximized) {
		$popup.dialog("option", "maximized", false);
		$popup.dialog("option", "width", popupInfo.popupWidth);
		$popup.dialog("option", "height", popupInfo.popupHeight);
		$popup.dialog("option", "resizable", true);
		$popup.dialog("option", "position", { my: "center center", at: "center center" });
		$maxBox = $("#max_box", $popup.$widget);
		$maxBox.attr('title', 'Maximize');
		$maxBox.removeClass("restore");
	}
	else {
		var newPosition = { my: "left top", at: "left top", of: window };
		$popup.dialog("option", "position", newPosition);
		$popup.dialog("option", "width", $(window).width() - 15);
		$popup.dialog("option", "height", $(window).height() - 10);
		$popup.dialog("option", "resizable", false);
		$popup.dialog("option", "maximized", true);
		$maxBox = $("#max_box", $popup.$widget);
		$maxBox.attr('title', 'Restore');
		$maxBox.addClass("restore");
	}

	$popup.$widget = $popup.dialog("widget");
}

// dialogBeforeClose
// this should never be called directly
function dialogBeforeClose() {
	window.top.closeModalPopup();
	return false;
}

// showPhotoAlbum
function showPhotoAlbum(id, clubId) {
	openModalPopup('/popup.aspx?page_id=215&amp;club_id=' + clubId + '&item_id=' + id, 640, 580, '', true, 'photo-album', true, true);
}

var multiSelectLoaded = false;
// loadMultiSelect
function loadMultiSelect() {
	if (multiSelectLoaded) {
		return;
	}
	if (document.createStyleSheet) {
		document.createStyleSheet('script/jquery.multiselect.css');
	}
	else {
		$("head").append($("<link rel='stylesheet' href='script/jquery.multiselect.css' type='text/css' media='screen' />"));
	}
	$.ajax({
		url: "script/jquery.multiselect.js?v=1.3",
		dataType: "script",
		cache: true,
		async: false,
		success: function () {
			multiSelectLoaded = true;
		}
	});
}

// showPhoto
function showPhoto(url) {
	showImage(url);
}

// showImage
function showImage(url, title, description) {
	if (window != window.top) {
		window.top.showImage(url, title, description);
		return;
	}

	var $dialog = $("<div></div>");
	var image = document.createElement("img")

	image.onload = function () {
		var imageWidth = this.width;
		var maxWidth = $(window).width() - 60;
		if (imageWidth > maxWidth) {
			imageWidth = maxWidth;
		}

		this.width = imageWidth;
		this.title = title;
		$dialog.append(this);
		$dialog.dialog({ "resizable": false, "width": imageWidth + 10, "autoOpen": true, "modal": true, "dialogClass": "image-dialog", "minHeight": "40px", "minWidth": "40px" });
		setHtmlDialogTitle(title, $dialog);
	};
	image.onerror = function () {
		showErrorMessage("Sorry - the requested image could not be loaded");
	};
	image.src = url;
}

// popupCalendarForTextbox
function popupCalendarForTextbox(textBoxControl) {
	$(textBoxControl).datepicker({selectOtherMonths: true, showOtherMonths: true, yearRange:"-10:+10", changeYear: true, changeMonth: true});
	$(textBoxControl).datepicker("show");
}

// image management stuff

var fileInputControl = null;
var imagePreviewControl = null;
var testImage = null;
var resizeRequired = false;
var maxImageWidth;
var maxImageHeight;
var imageSuccessFunction;
var imageErrorFunction;
var showResizeMessage;

// browserCanShowPreview
function browserCanShowPreview() {
	return false;  // this is going away
}

// getPreviewFileName
function getPreviewFileName(fullFileName) {
	if (!fullFileName) {
		return "";
	}
	var startPosition = fullFileName.lastIndexOf("\\");
	return fullFileName.substring(startPosition + 1);
}

// getUrlFileName
function getUrlFileName(fullFileName) {
	if (!fullFileName) {
		return "";
	}
	var startPosition = fullFileName.lastIndexOf("/");
	return fullFileName.substring(startPosition + 1).replace(")", "");
}

// previewImageWithFileName
function previewImageWithFileName(fileName, imagePreviewControlName, maxWidth, maxHeight, successFunction, errorFunction, resizeMessageRequired) {
	imagePreviewControl = document.getElementById(imagePreviewControlName);
	maxImageWidth = maxWidth;
	maxImageHeight = maxHeight;

	if (successFunction) {
		imageSuccessFunction = successFunction;
	}
	if (errorFunction) {
		imageErrorFunction = errorFunction;
	}
	if (resizeMessageRequired == true) {
		showResizeMessage = true;
	}
	else {
		showResizeMessage = false;
	}

	imagePreviewControl.style.visibility = "hidden";
	testImage = new Image();
	testImage.onload = resizePreview;
	if (imageErrorFunction) {
		testImage.onerror = imageErrorFunction;
	}

	testImage.src = fileName;
}

// resizePreview
function resizePreview() {
	testImage.onload = null;
	testImage.onerror = null;
	var originalWidth = testImage.width;
	var widthRatio = 1;
	if (originalWidth > maxImageWidth) {
		testImage.width = maxImageWidth;
		widthRatio = originalWidth / maxImageWidth;
		testImage.height = testImage.height / widthRatio;
		resizeRequired = true;
	}

	if (testImage.height > maxImageHeight) {
		var heightRatio = testImage.height / maxImageHeight;
		testImage.height = testImage.height / heightRatio;
		testImage.width = testImage.width / heightRatio;
		resizeRequired = true;
	}

	imagePreviewControl.onload = showPreviewImage;
	if (imageErrorFunction) {
		imagePreviewControl.onerror = imageErrorFunction;
	}

	imagePreviewControl.width = testImage.width;
	imagePreviewControl.height = testImage.height;
	imagePreviewControl.src = testImage.src;
	if ((resizeRequired == true) && (showResizeMessage)) {
		alert("The image will be resized as shown to fit the available space");
	}
	resizeRequired = false;
}

// showPreviewImage
function showPreviewImage() {
	imagePreviewControl.onload = null;
	imagePreviewControl.onerror = null;
	if (testImage == null) {
		return;
	}
	imagePreviewControl.width = testImage.width;
	imagePreviewControl.height = testImage.height;
	imagePreviewControl.style.visibility = "visible";
	testImage = null;
	if (imageSuccessFunction) {
		imageSuccessFunction();
	}
}

// resizeImage
function resizeImage(image, maxImageWidth, maxImageHeight) {
	var originalWidth = image.width;
	var widthRatio = 1;
	if (originalWidth > maxImageWidth) {
		image.width = maxImageWidth;
		widthRatio = originalWidth / maxImageWidth;
		image.height = image.height / widthRatio;
	}

	if (image.height > maxImageHeight) {
		var heightRatio = image.height / maxImageHeight;
		image.height = image.height / heightRatio;
		image.width = image.width / heightRatio;
	}
}

// refreshPage
function refreshPage() {
	var submitButton = document.getElementById(submitButtonName);
	if (submitButton == null) {
		var currentUrl = window.location.href;
		if (currentUrl.indexOf("action=") == -1) {
			window.location.reload();
		}
		else {
			var regex = new RegExp("action=[^&]*&?");
			newUrl = currentUrl.replace(regex, "");
			window.location.href = newUrl;
		}
	}
	else {
		submitButton.onclick();
	}
}

// formatNumber
function formatNumber(number, decimalPlaces, useSeparator) {
	if (isNaN(parseFloat(number))) {
		return "NaN";
	}
	if (isNaN(parseInt(decimalPlaces, 10))) {
		decimalPlaces = 2;
	}

	if (decimalPlaces == 0) {
		number = Math.round(number);
	}

	var options = { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces, useGrouping: useSeparator };
	return number.toLocaleString(undefined, options);
}

//// formatNumber
//function formatNumber(number, decimalPlaces, dollarSign, scaleFactor) {
//	//return formatNumber2(number, decimalPlaces, dollarSign, scaleFactor, true);
//	return formatNumber3(number, decimalPlaces, true);
//}

//// formatNumber2
//function formatNumber2(number, decimalPlaces, dollarSign, scaleFactor, useSeparator) {
//	return formatNumber3(number, decimalPlaces, useSeparator);
	//if (isNaN(parseFloat(number))) {
	//	return "NaN";
	//}
	//if (isNaN(parseInt(decimalPlaces, 10))) {
	//	decimalPlaces = 2;
	//}

	//if (decimalPlaces == 0) {
	//	if (commas == true) {
	//		return addCommas(Math.round(number).toString());
	//	}
	//	else {
	//		return Math.round(number).toString();
	//	}
	//}

	//if (isNaN(parseInt(scaleFactor))) {
	//	scaleFactor = 0;
	//}
	//var numberString = "" + Math.round(number * Math.pow(10, (decimalPlaces - scaleFactor)));
	//while (numberString.length <= decimalPlaces) {
	//	numberString = "0" + numberString;
	//}
	//var decimalPosition = numberString.length - decimalPlaces;

	//if (dollarSign == true) {
	//	dollarSign = "$ ";
	//}
	//else {
	//	dollarSign = "";
	//}
	//if (commas) {
	//	return dollarSign + addCommas(numberString.substring(0, decimalPosition) + "." + numberString.substring(decimalPosition, numberString.length));
	//}
	//else {
	//	return numberString.substring(0, decimalPosition) + "." + numberString.substring(decimalPosition, numberString.length);
	//}
//}

//// addCommas
//function addCommas(nStr) {
//	nStr += '';
//	x = nStr.split('.');
//	x1 = x[0];
//	x2 = x.length > 1 ? '.' + x[1] : '';
//	var rgx = /(\d+)(\d{3})/;
//	while (rgx.test(x1)) {
//		x1 = x1.replace(rgx, '$1' + ',' + '$2');
//	}
//	return x1 + x2;
//}

// roundFloat
function roundFloat(number, decimalPlaces) {
	if (isNaN(parseFloat(number))) {
		return "NaN";
	}
	if (isNaN(parseInt(decimalPlaces, 10))) {
		decimalPlaces = 2;
	}

	return parseFloat(number.toFixed(decimalPlaces));
}

// getAjaxObject
function getAjaxObject() {
	if (window.ActiveXObject) { // IE
		return new ActiveXObject("Microsoft.XMLHTTP");
	}
	else {
		if (window.XMLHttpRequest) { // Non-IE browsers
			return new XMLHttpRequest();
		}
		else {
			return null;
		}
	}
}

// trimString
function trimString(input) {
	var regex = new RegExp("^\\s+");
	var output = input.replace(regex, "");

	regex = new RegExp("\\s+$");
	output = output.replace(regex, "");

	return output;
}

// keyDownHandler
function keyDownHandler(e) {
	var keyNumber = 0;
	var source;
	if (e) {
		// netscape/mozilla code
		keyNumber = e.which;
		source = e.target;
	}
	else {
		// ie code
		keyNumber = window.event.keyCode;
		source = window.event.srcElement;
	}

	// let alpha, numeric, and standard punctuation keys go
	if ((keyNumber >= 32) && (keyNumber <= 97)) {
		return true;
	}

	// escape
	if (keyNumber == 27) {
		var cancelButton = document.getElementById(cancelButtonName);
		if (cancelButton == null) {
			doCancel();
		}
		else {
			window.setTimeout(cancelButton.onclick, 20);
		}
		return false;
	}

	// F1
	if (keyNumber == 112) {
		showHelp(pageId);
		return false;
	}

	// enter (return)
	if (keyNumber == 13) {
		if (source.type == "textarea") {
			return true;
		}
		else if ((source.type == "text") && (source.id) && (source.id.indexOf('tag_box') != -1)) {
			// enter key in a tag box should not trigger a post back
			return false;
		}
		else {
			var submitButton = document.getElementById(submitButtonName);
			if (submitButton != null) {
				submitButton.onclick();
			}
			return false;  // return false for enter keys so that there are no accidental form submits
		}
	}

	// default
	return true;
}   // keyDownHandler

// escapeQuotes
function escapeQuotes(text) {
	return text.replace(/"/g, '\\"').replace(/'/g, "\\'");
}

// encodeQuotes
function encodeQuotes(text) {
	return text.replace(/"/g, '&quot;').replace(/'/g, "&#39;");
}

// showInfoMessage
function showInfoMessage(message, sticky) {
	var options = { "dialogClass": "info-dialog", "resizable": "false", "modal": false, title: "Message", addOKButton: true };

	if (typeof message == "string") {
		options.sticky = !!sticky;
		options.message = message;
	}
	else {
		if (message.jquery) {
			options.$message = message;

			if (message.attr("sticky") || (!!sticky)) {
				options.sticky = true;
			}
			var messageTitle = message.attr("title");
			if (messageTitle) {
				options.title = messageTitle;
			}
		}
		else {
			return;
		}
	}
	showMessage(options);
}

// showErrorMessage
function showErrorMessage(message) {
	var options = { "dialogClass": "error-dialog", "title": "Error", "sticky": true, "addOKButton": true, "resizable": "false", "modal": true, "position": { my: "center center", at: "center center", within: window } };
	if (typeof message == "string") {
		options.message = message;
	}
	else {
		if (message.jquery) {
			options.$message = message;
		}
		else {
			return;
		}
	}
	options.titleOnly = false;
	if (isPopup) {
		options.position.within = $("div.popup-wrapper");
		options.position.of = null;
	}
	showMessage(options);
}

// showMessage
function showMessage(options) {
	if ((!options.message) && (!options.$message)) {
		return;
	}

	if (!options.$message) {
		options.$message = $("<div>" + options.message + "</div>");
	}

	if (options.addOKButton) {
		options.buttons = [{
			text: "Ok",
			click: function () { $(this).dialog("close"); }
		}];
		options.open = function () {
			$(this).focus();
			$(this).keydown(function (e) {
				if (e.keyCode == $.ui.keyCode.ENTER) {
					$(this).dialog("close");
					return false;
				}
			});
		};
	}
	if (!options.sticky) {
		options.open = function () {
			var $this = $(this);
			setTimeout(function () { try{ $this.dialog("option", "hide", { effect: "fade", duration: 2000 }); $this.dialog("close"); } catch (e) {} }, 5000);
		};
	}

	var $dialog = options.$message.dialog(options).dialog("widget");
	options.$message.dialog("open");
}

// askYesNoQuestion
function askYesNoQuestion(questionText, questionTitle, yesText, yesFunction, noText, noFunction) {
	var options = {
		'questionText': questionText,
		title: questionTitle,
		buttons: [
			{
				text: yesText,
				click: function () {
					$(this).dialog("close");
					yesFunction.call();
				}
			},
			{
				text: noText,
				click: function () {
					$(this).dialog("close");
					noFunction.call();
				}
			}
		]
	}
	askQuestion(options);
	//$('<div></div>').appendTo('body')
	//  .html('<div><h6>' + questionText + '</h6></div>')
	//  .dialog({
	//  	modal: true,
	//  	title: questionTitle,
	//  	zIndex: 10000,
	//  	autoOpen: true,
	//  	width: 'auto',
	//  	resizable: false,
	//  	buttons : [
	//			{
	//				text: yesText,
	//				click: function() {
	//					$(this).dialog("close");
	//					yesFunction.call();
	//				}
	//			},
	//			{
	//				text: noText,
	//				click: function () {
	//					$(this).dialog("close");
	//					noFunction.call();
	//				}
	//			}
	//		],
	//  	close: function (event, ui) {
	//  		$(this).remove();
	//  	}
	//  });
}

// askQuestion
function askQuestion(customOptions) {
	var options = {
		modal: true,
		zIndex: 10000,
		autoOpen: true,
		width: 'auto',
		resizable: false,
		close: function (event, ui) {
			$(this).remove();
		}
	};
	$.extend(options, customOptions);
		//options.buttons[0].originalClick = options.buttons[0].click;
		//options.buttons[0].click = function (event) {
		//	$(this).dialog("close");
		//	options.buttons[0].originalClick.call();
		//}

		//options.buttons[1].originalClick = options.buttons[1].click;
		//options.buttons[1].click = function (event) {
		//	$(this).dialog("close");
		//	options.buttons[1].originalClick.call();
		//}
	//for (var button in options.buttons) {
	//	options.buttons[button].originalClick = options.buttons[button].click;
	//	options.buttons[button].click = function (event) {
	//		$(this).dialog("close");
	//		options.buttons[button].originalClick.call();
	//	}
	//}
	$('<div></div>').appendTo('body').html('<div id="ask_question_text">' + options.questionText + '</div>').dialog(options);
}

// ready
// process message boxes and widgets, page tools
$(document).ready(function () {
	// connect keyHandler function to key down event
	document.onkeydown = keyDownHandler;

	var $error = $("#error_message");
	if ($error.length != 0) {
		showErrorMessage($error.html());
		$error.hide();
	}

	var $info = $("#info_message");
	if ($info.length != 0) {
		var sticky = $info.attr("sticky");
		showInfoMessage($info.html(), sticky);
		$info.hide();
	}

	// nothing else applies to popups
	if (isPopup) {
		return;
	}
	if (isMobileDevice) {
		mobilePageToolsHide();
	}
	else {
		$pageTools = $("#page_tools");
		$slidingPageTools = $("#sliding_page_tools");
		getLayoutWrapper();
		setupPageTools();
	}
	// process widgets
	var $widgets = $("div.ce-widget, div.widget-container").not(".no-handler");
	if ($widgets.length != 0) {
		processWidgets($widgets);
	}
	if (userLoggedIn) {
		wrapHighResolution();
		displayFavorites();
	}
});		// end of doc.ready

// displayFavorites
function displayFavorites () {
	$('#favorites_hover').hoverIntent(
		function () {
			$("#favorites_dropdown").show();
		},
		function () {
			$("#favorites_dropdown").hide();
	});
}

// getLayoutWrapper
function getLayoutWrapper() {
	$layoutWrapper = $("#layout_wrapper, div.layout-wrapper");
	if ($layoutWrapper.length != 0) {
		return;
	}
	$layoutWrapper = $("div.template-wrapper");
	if ($layoutWrapper.length != 0) {
		return;
	}
	$layoutWrapper = $("div.content-container");
	if ($layoutWrapper.length != 0) {
		return;
	}
	$layoutWrapper = $("div.page-container");
	if ($layoutWrapper.length != 0) {
		return;
	}
	$layoutWrapper = $("td.content-container");
	if ($layoutWrapper.length != 0) {
		return;
	}
	$layoutWrapper = $("table.outer-box");
	if ($layoutWrapper.length != 0) {
		return;
	}
	$layoutWrapper = $("table.template-table");
	if ($layoutWrapper.length != 0) {
		return;
	}
	$layoutWrapper = $("table.main-table");
	if ($layoutWrapper.length != 0) {
		return;
	}
	$layoutWrapper = $("#page_content");
}

// page tools stuff
var $pageToolsReferenceElement;
var pageWidth, layoutWidth, windowWidth;
var horizontalPosition, verticalPosition;
var tooWide;
var myPosition = "left top";
var atPosition;
var forcedPosition = false;
var PageToolsEvent = {};
PageToolsEvent.Load = 1;
PageToolsEvent.Resize = 2;
PageToolsEvent.Scroll = 3;
PageToolsEvent.PageWidth = 4;
var xCookie = "ptx";
var yCookie = "pty";

// setupPageTools
function setupPageTools() {
	if (previewMode || (($pageTools.length == 0) && $slidingPageTools.length == 0)) {
		$pageTools.hide();
		$slidingPageTools.hide();
		return;
	}
	if (isIE7) {
		window.setTimeout(function () {
			positionPageTools(PageToolsEvent.Load);
		}, 1000);
	}
	else {
		positionPageTools(PageToolsEvent.Load);
	}
	$(window).resize(function () {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function () { positionPageTools(PageToolsEvent.Resize); }, 100);
	});
	$(window).scroll(function () {
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(function () { positionPageTools(PageToolsEvent.Scroll); }, 100);
	});
	$("#drag_box", $pageTools).hover(function () { $pageTools.draggable({ "stop": function (event, ui) { forcePageToolsPosition(ui.position.left, ui.position.top); } }) });
}

// positionPageTools
function positionPageTools(event) {
	if (event == PageToolsEvent.Load) {
		var ptx = getCookie(xCookie);
		if (ptx) {
			var pty = getCookie(yCookie);
			forcedPosition = true;
			getForcedPosition(ptx, pty);
		}
		else {
			verticalPosition = "top+200";
			if (pageToolsReferenceSelector) {
				$pageToolsReferenceElement = $(pageToolsReferenceSelector);
			}
			else {
				$pageToolsReferenceElement = $layoutWrapper;
			}
			windowWidth = $(window).outerWidth();
			forcedPosition = false;
		}
	}

	if (!forcedPosition) {
		if ((event == PageToolsEvent.Load) || (event == PageToolsEvent.PageWidth)) {
			layoutWidth = $layoutWrapper.outerWidth();
			if (isIE7) {
				pageWidth = $pageToolsReferenceElement.get(0).offsetWidth;
			}
			else {
				pageWidth = $pageToolsReferenceElement.outerWidth();
			}

			// adjust page width for centering
			if (pageWidth > layoutWidth) {
				pageWidth += (pageWidth - layoutWidth);
			}
			else {
				pageWidth = layoutWidth;
			}
		}

		if (event == PageToolsEvent.Resize) {
			var newWindowWidth = $(window).width();
			// skip ie7 repeated resize events
			if (newWindowWidth == windowWidth) {
				return;
			}
			else {
				windowWidth = newWindowWidth;
			}
		}

		if (event != PageToolsEvent.Scroll) {
			if (pageWidth > (windowWidth - 60)) {
				tooWide = true;
				myPosition = "right top";
				horizontalPosition = "right";
			}
			else {
				tooWide = false;
				myPosition = "left top";
				var toolsX = windowWidth - ((windowWidth - pageWidth) / 2);
				horizontalPosition = "left+" + Math.round(toolsX);
			}
			atPosition = horizontalPosition + " " + verticalPosition;
		}
	}
	$pageTools.position({ my: myPosition, at: atPosition, of: window });
	if (tooWide) {
		$pageTools.css("z-index", 200);
	}
}

// getForcedPosition
function getForcedPosition(x, y) {
	verticalPosition = "top+" + y;

	horizontalPosition = "left+" + x;
	atPosition = horizontalPosition + " " + verticalPosition;
}

// forcePageToolsPosition
function forcePageToolsPosition(x, y) {
	var scrollTopPosition;

	if (window.pageYOffset != null) {
		scrollTopPosition = window.pageYOffset;
	}
	else {
		scrollTopPosition = window.document.documentElement.scrollTop;
	}

	var offset = Math.max(0, scrollTopPosition);
	y -= offset;

	setCookie(xCookie, x, 7);
	setCookie(yCookie, y, 7);

	getForcedPosition(x, y);

	forcedPosition = true;
}

///cookie stuff
// setCookie
function setCookie(name, value, days) {
	var expires;
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toGMTString();
	}
	else {
		expires = "";
	}
	document.cookie = name + "=" + value + expires + "; path=/";
}

// getCookie
function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substr(1, c.length);
		if (c.indexOf(nameEQ) == 0) {
			return c.substr(nameEQ.length, c.length);
		}
	}
	return null;
}

// deleteCookie
function deleteCookie(name) {
	setCookie(name, "", -1);
}

// hoverIntent r6 // 2011.02.26 // jQuery 1.5.1+
(function ($) { $.fn.hoverIntent = function (f, g) { var cfg = { sensitivity: 7, interval: 100, timeout: 0 }; cfg = $.extend(cfg, g ? { over: f, out: g} : f); var cX, cY, pX, pY; var track = function (ev) { cX = ev.pageX; cY = ev.pageY }; var compare = function (ev, ob) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); if ((Math.abs(pX - cX) + Math.abs(pY - cY)) < cfg.sensitivity) { $(ob).unbind("mousemove", track); ob.hoverIntent_s = 1; return cfg.over.apply(ob, [ev]) } else { pX = cX; pY = cY; ob.hoverIntent_t = setTimeout(function () { compare(ev, ob) }, cfg.interval) } }; var delay = function (ev, ob) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); ob.hoverIntent_s = 0; return cfg.out.apply(ob, [ev]) }; var handleHover = function (e) { var ev = jQuery.extend({}, e); var ob = this; if (ob.hoverIntent_t) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t) } if (e.type == "mouseenter") { pX = ev.pageX; pY = ev.pageY; $(ob).bind("mousemove", track); if (ob.hoverIntent_s != 1) { ob.hoverIntent_t = setTimeout(function () { compare(ev, ob) }, cfg.interval) } } else { $(ob).unbind("mousemove", track); if (ob.hoverIntent_s == 1) { ob.hoverIntent_t = setTimeout(function () { delay(ev, ob) }, cfg.timeout) } } }; return this.bind('mouseenter', handleHover).bind('mouseleave', handleHover) } })(jQuery);

// used only by photo albums and color picker
// closable 11/27/2012 from rick strahl
(function (e) { e.fn.closable = function (t) { var n = { handle: null, closeHandler: null, cssClass: "closebox", imageUrl: null, fadeOut: null }; e.extend(n, t); return this.each(function (t) { var r = e(this); var i = r.css("position"); if (!i || i == "static") r.css("position", "absolute"); var s = n.handle ? e(n.handle).css({ position: "relative" }) : r; var o = n.imageUrl ? e("<img>").attr("src", n.imageUrl).css("cursor", "pointer") : e("<div>"); o.addClass(n.cssClass).click(function (t) { if (n.closeHandler) if (!n.closeHandler.call(this, t)) return; if (n.fadeOut) e(r).fadeOut(n.fadeOut); else e(r).hide() }); if (n.imageUrl) o.css("background-image", "none"); s.append(o) }) } })(jQuery)

// text size control
var textSizeState = 1;
var $textSizeElements = null;
function toggleTextSize() {
	if (! $textSizeElements) {
		$textSizeElements = $("*").not("body").not("#footer *").not(".footer-container *").not(".main-menu *").not(".site-menu *").not(".ui-tabs-nav *").not("#user_panel *").not ("#tool_wrapper *");
	 }

	switch (textSizeState) {
		case 1:
			$textSizeElements.css("font-size", "inherit");
			$("body").css("font-size", "115%");
			textSizeState = 2;
			break;
		case 2:
			$("body").css("font-size", "130%");
			textSizeState = 3;
			break;
		case 3:
			$textSizeElements.css("font-size", "");
			$("body").css("font-size", "");
			textSizeState = 1;
			break;
	}
}

// styleDialog
function styleDialog($printDoc) {
	$("h1", $printDoc).show();
	var $scripts = $("script", $printDoc);
	$scripts.remove();
}

// printIframeDialog
function printIframeDialog(iframeName) {
	var dialogIframe = window.top.frames[iframeName];
	var $printElement = $("div#popup_wrapper > form", dialogIframe.document);
	printPage($printElement);
}

var printAreaLoaded = false;

// printPage
function printPage(contentContainer, pageHeader, clubName, clubUrl, additionalCss) {
	var $content;
	if (contentContainer) {
		if (contentContainer.jquery) {
			$content = contentContainer;
		}
		else {
			$content = $("#" + contentContainer);
		}
	}
	else {
		$content = $("#page_content");
		if ($content.length == 0) {
			$content = $("#ctl00_page_content");
		}
	}
	if ($content.length == 0) {
		return;
	}

	var options = {
						popClose: false,
						mode: 'iframe',
						extraCss: additionalCss,
						popTitle: pageHeader,
						header: pageHeader,
						callback: styleDialog
					};

	if (printAreaLoaded) {
		$content.printArea(options);
	}
	else {
		$.ajax({
			url: "/script/printArea_min.js?v=20141028",
			dataType: "script",
			cache: true,
			async: true,
			success: function () {
				$content.printArea(options);
				printAreaLoaded = true;
			}
		});
	}
}

// manager page legends
var legendLoaded = false;

// setupLegend
function setupLegend() {
	var $managerTables = $("table.manager-table").filter(":not(.no-legend)");
	$managerTables.each(function () {
		var $table = $(this);
		if ($("tbody tr td a", $table).length == 0) {
			return;
		}
		var $maintainHeader = $("tr:first th:last", $table);
		//		var $maintainHeader = $("tr th", $table).filter(':last');
		if ($maintainHeader.length != 1) {
			return;
		}
		var $legendWrapper = $('<div class="legend-wrapper"><div class="legend-drop-down"></div><div class="legend-drop-info"></div></div>');
		$maintainHeader.append($legendWrapper);
		$legendWrapper.hoverIntent(
				function () { loadLegend($table, $legendWrapper); $(".legend-drop-info", $legendWrapper).show().position({ 'my': 'right bottom ', 'at': 'left bottom ', 'of': $(".legend-drop-down", $legendWrapper), 'collision': 'fit' }); },
				function () { $(".legend-drop-info", $legendWrapper).hide(); }
		);
	});
}

// loadLegend
function loadLegend($table, $legendWrapper) {
	if ($table.data("legendLoaded")) {
		return;
	}

	var $iconCell = $("tbody tr td", $table).filter(':last-child');
	var $icons = $("a", $iconCell);
	if ($icons.length == 0) {
		return;
	}
	var legendList = {};
	var legendHtml = '';

	$icons.each(function () {
		legendList[this.className] = this.title;
	});

	for (var className in legendList) {
		legendHtml += '<div class="legend-item ' + className + '"></div>' + '<div class="legend-description">' + legendList[className] + '</div>'
	}
	$("div.legend-drop-info", $legendWrapper).html(legendHtml);
	$table.data("legendLoaded", true);
}

// addTextareaResize
function addTextareaResize($textareas) {
	if (navigator.userAgent.match(/(MSIE)|(Trident)/)) {
		$textareas.resizable({
			handles: "se",
			stop: function (event, ui) { if (!isIE7) { ui.element.css("height", "-=10px"); } }
		});
		$("div.ui-resizable-se", $textareas.parent()).css("bottom", "10px").css('right', '5px');  // this is a trick to push the resize icon into the textarea
		if (!isIE7) {
			$textareas.parent().css("height", "-=10px");  // shrinks unneeed space under text area
		}
	}
	else {
		$textareas.wrap('<div class="text-area-wrapper"></div>');
	}
}

// addTextareaCounters
function addTextareaCounters($textareas, options) {
	if (!options) {
		options = {
			skipWhenDisabled: true
		};
	}
	$textareas.each(function () {
		var $textarea = $(this);
		if (options.skipWhenDisabled) {
			if ($textarea.prop("disabled")) {
				return;
			}
		}
		var maxLength = $textarea.attr('max_length');
		if (maxLength) {
			options.maxCharacterSize = maxLength;
		}
		if (!options.maxCharacterSize) {
			return;  // no default
		}

		$textarea.textareaCount(options);
	});
}

// setupTextareas
// add counter and resize handles
function setupTextareas(selector, options) {
	var $textareas;
	if (!selector) {
		$textareas = $('textarea');  // select all - default
	}
	else {
		if (typeof selector == "string") {
			$textareas = $(selector);
		}
		else {
			if (selector.jquery) {
				$textareas = selector;
			}
		}
	}
	if ($textareas.length == 0) {
		return;
	}

	$.ajax({
		url: "/script/jquery.textareaCounter.plugin.js?v=20150417",
		dataType: "script",
		cache: true,
		async: true,
		success: function () {
			addTextareaResize($textareas);
			addTextareaCounters($textareas, options);
		}
	});
}

// animateSocial
function animateSocial() {
	$('div#share_button_container').click(function () {
		$('div#vistoggle').fadeTo(300, 1).show();
	});
	$('div#social_close').click(function () {
		$('div#vistoggle').fadeTo(300, 0).hide();
	});
	$('a.social-panel-icon').hover(function () {
		$(this).stop().fadeTo(300, 1).siblings().stop().fadeTo(300, 0.2);
		if ($('div#share_pop_out').is(':visible')) {
			$(this).stop().fadeTo(300, 1).siblings().stop().fadeTo(300, 1);
		}
	},
	function () {
		$(this).stop().fadeTo(300, 1).siblings().stop().fadeTo(300, 1);
	});
	$('div#share_hover_button').hover(function () {
		$(this).stop().fadeTo(300, 1).siblings().stop().fadeTo(300, 0.2);
	},
	function () {
		$(this).stop().fadeTo(300, 1).siblings().stop().fadeTo(300, 1);
	});
}
function mobilePageToolsHide() {
	$('#mobile_tools_handle').click(function () {
		var down = $('#mobile_tools').css('height') == '60px';
		if (down) {
			$('#mobile_tools').animate({ height: 5 }, 500);
			$('#tools_position').hide();
		}
		else {
			$('#mobile_tools').animate({ height: 60 }, 500);
			$('#tools_position').show();
		}
		// $('#mobile_tools').animate({ height: 5 });
	});
}

function valAlert(group, isValid) {
	if (!isValid) {
		showErrorMessage("Please correct the errors shown");
	}
}

function wrapHighResolution() {
	$('img.hi-res').wrap("<span class='hi-res-wrapper'> <a href='#' class='hi-res-icon' onclick='downloadHiRes(this);return false;' title='Click to download hi res version'></a></span>")
}

function downloadHiRes(el) {
	$this = $(el);
	var url = $this.siblings('img.hi-res').attr("src");
	var orUrl = url.replace("/screen/", "/original/");
	window.open(orUrl, "_blank");
}
