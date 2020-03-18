$(function () {
	$('#user_bar').hoverIntent(function () { $(".member-drop").show(); },
	function () {
		$(".member-drop").hide();
	});
	$('#user_bar').hover(
			function () { $('#user_arrow').addClass('panel-selected').prev().addClass('name-selected') },
			function () { $('#user_arrow').removeClass('panel-selected').prev().removeClass('name-selected') }
	);
});

if ($('#non_member_panel').length) {
	$("#user_bar").css('background-image', 'none');
}


function renewNow() {
	window.location.href = renewLink;
}

function payNow() {
	window.location.href = paymentLink;
}

function closeThis() {
	$('.ui-dialog').dialog().dialog("close");
}

// showUserPopup
function showUserPopup(renewal, isTrial) {
	var message;
	var title;
	if (isTrial) {
		title = "Upgrade Your Trial Membership";
		message = "<div style='text-align:center;line-height:2;'>It looks like your trial membership is expiring.<br/><br> <button style='padding:.4em 1em;margin:3px;' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' onclick='renewNow();'>Yes, I want to Upgrade Now</button><button style='padding:.4em 1em;margin:3px;' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' onclick='closeThis();'> No, I won&apos;t Upgrade Now</button></div>";
	}
	else if (renewal && !isTrial) {
		title = "Your membership is expiring";
		message = "<div style='text-align:center;line-height:2;'>It looks like your membership is expiring soon.<br/><br> <button style='padding:.4em 1em;margin:3px;' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' onclick='renewNow();'>Yes, I want to Renew Now</button><button style='padding:.4em 1em;margin:3px;' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' onclick='closeThis();'> No, I won&apos;t Renew Now</button></div>";
	}
	else {
		title = "You have a pending payment";
		message = "<div style='text-align:center;line-height:2;'>It looks like you have at least one pending payment.<br><br> <button style='padding:.4em 1em;margin:3px;' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' onclick='payNow();'>Yes, I want to make a Payment</button><button style='padding:.4em 1em;margin:3px;' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' onclick='closeThis();'> No, I won&apos;t Pay Now</button></div>";
	}
	var options = {
		"dialogClass": "info-dialog",
		"resizable": true,
		"modal": false,
		'title': title,
		'addOKButton': false,
		'sticky': true,
		'message': message,
		'width': 'auto'
	};
	showMessage(options);
}

// showCart
function showCart(element) {
	var tooltipManager = $find(cartId);
	if (!tooltipManager) return;
	var tooltip = tooltipManager.createToolTip(element);
	tooltip.set_content("<img src='/images/loading.gif' hspace=100 vspace=30>");
	tooltip.set_title("Please Wait");
	tooltip.show();

	$.get(clubPrefix + "storefront/controls/order_summary.aspx?&m=1", function (data) {
		tooltip.set_title("Shopping Cart");
		tooltip.set_content(data);
	}, "html");

}