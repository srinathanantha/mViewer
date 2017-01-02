/*eslint-disable */
$(document).on('mouseenter', '#toolTip', function () {
     const $this = $(this);
     if (this.offsetWidth < this.scrollWidth && !$this.attr('title')) {
         $this.tooltip({
             title: $this.text(),
             placement: 'right'
         });
         $this.tooltip('show');
     }
 });


$(document).on('mouseenter', '#toolTipDb', function () {
     const $this = $(this);
     if (this.offsetWidth < this.scrollWidth ) {
         $this.tooltip({
             title: $this.text(),
             placement: 'right'
         });
         $this.tooltip('show');
     }
 });
/*eslint-enable */