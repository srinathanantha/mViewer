$(document).on('mouseenter', "#toolTip", function () {
     var $this = $(this);
     if (this.offsetWidth < this.scrollWidth && !$this.attr('title')) {
         $this.tooltip({
             title: $this.text(),
             placement: "right"
         });
         $this.tooltip('show');
     }
 });


$(document).on('mouseenter', "#toolTipDb", function () {
     var $this = $(this);
     if (this.offsetWidth < this.scrollWidth ) {
         $this.tooltip({
             title: $this.text(),
             placement: "right"
         });
         $this.tooltip('show');
     }
 });