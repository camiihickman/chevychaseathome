
// processWidgets
function processWidgets($widgets) {
	$widgets.each(function () { var $this = $(this); loadWidgetData($this, this.id) });
	var $accordions = $widgets.filter('div.accordion-widget');
	var $weather = $widgets.filter('div.weather-widget');
	if ($accordions.length != 0) {
		enableAccordions($accordions);
	}
	if ($weather.length != 0) { //refresh the weather iframe
		$('#forecast_embed').attr('src', $('#forecast_embed').attr('src'));
	}
}
// loadWidgetData
function loadWidgetData($widget, id) {
	var url = "widget.ashx?p=" + id;
	var widgetType = id.substr(0, 1);
	switch (widgetType) {
		case "e":
			//			window.setTimeout(function () {  // testing code
			$widget.load(url, function () { $("<div class='ue-title'>" + $widget.attr("title") + "</div>").insertBefore($("*", $widget).first()); });
			//			}, 5000);
			return;
		case "p":
		case "c":
			$widget.load(url);
			return;
		case "s":
			loadGalleria();
			$.ajax({
				url: url,
				datatype: "json",
				success: function (data) { widgetLoaded($widget, widgetType, id, data); }
			});
			return;
		case "m":
			$widget.load(url, function () { $("<div class='ue-title'>" + $widget.attr("title") + "</div>").insertBefore($("*", $widget).first()); });
			return;
		case "b":
			$widget.load(url, function () { $("<div class='rb-title'>" + $widget.attr("title") + "</div>").insertBefore($("*", $widget).first()); });
			return;
		case "n":
			$widget.load(url, function () { $("<div class='rn-title'>" + $widget.attr("title") + "</div>").insertBefore($("*", $widget).first()); });
			return;
		case "g": // grooming-trails
			$widget.load(url, function () { $("<div class='tr-title'>" + $widget.attr("title") + "</div>").insertBefore($("*", $widget).first()); });
			return;
		case "v": // birthdays & anniversaries
			$widget.load(url, function () { $("<div class='ba-title'>" + $widget.attr("title") + "</div>").insertBefore($("*", $widget).first()); });
			return;
	}
}

// widgetLoaded
function widgetLoaded($widget, widgetType, id, data) {
	switch (widgetType) {
		case "p":
			return;
		case "s":
			var albumData = eval("(" + data + ")");
			if ((albumData.imageArray) && (albumData.imageArray.length > 0)) {
				var newOptions = $.extend($widget.data("options"), { dataSource: eval(albumData.imageArray) });
				$widget.galleria(newOptions);
			}
			else {
				$widget.hide();
			}
			return;
	}
}

// postWidget
function postWidget(button, validationFunction) {
	var $widget = $(button).closest('.ce-widget');
	if (validationFunction) {
		if (!validationFunction($widget)) {
			return;
		}
	}
	var parameterArray = [{ name: "p", value: $widget.attr("id")}].concat($("input", $widget).serializeArray());
	$.post("widget.ashx", parameterArray, function (response) { $widget.html(response); }, "html");
}

// ensureResponse - used by polls
function ensureResponse($widget) {
	if ($("input:checked", $widget).length == 1) {
		return true;
	}
	else {
		showDialogMessage("Please make a selection", true, "Poll Error");
		return false;
	}
}

//enableAccordions - used by Accordions
function enableAccordions($accordions) {
	$accordions.find('.accordion-title').click(function () {
		$(this).next('.accordion-content').slideToggle();
		$(this).find('.accordion-arrow').toggleClass('expanded');
		$(this).find(".inner-ac-content").click(function(event){ event.stopPropagation()});
	});
}