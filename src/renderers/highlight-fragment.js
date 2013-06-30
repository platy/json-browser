(function (Jsonary) {

	Jsonary.render.Components.add("HIGHLIGHT_FRAGMENT");
	
	Jsonary.render.register({
		component: Jsonary.render.Components.HIGHLIGHT_FRAGMENT,
		renderHtml: function (data, context) {
			if (data.readOnly() && window.location.href.indexOf('#')) {
				if (window.location.href == data.referenceUrl()) {
					return '<div class="highlight-fragment">'+ context.renderHtml(data) + '</div>';
				} else {
					return '<span class="highlight-not-fragment">'+ context.renderHtml(data) + '</span>';
				}
			}
			return context.renderHtml(data);
		},
		filter: function () {
			return true;
		}
	});

})(Jsonary);
