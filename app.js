(function ($) {

    // on document load
    $(function () {

        // namespace application
        var Carousel = {
            Models: {},
            Collections: {},
            Views: {},
            Templates: {}
        };


        // MODELS ------------------------------------------------------------------------------------------------------
        // single carousel block model
        Carousel.Models.Block = Backbone.Model.extend({});


        // COLLECTIONS -------------------------------------------------------------------------------------------------
        // collection of carousel blocks
        Carousel.Collections.Blocks = Backbone.Collection.extend({
            model: Carousel.Models.Block,
            url: 'data/data.json'
        });


        // TEMPLATES ---------------------------------------------------------------------------------------------------
        // carousel container and navigation template
        Carousel.Templates.carousel = _.template($('#carousel-template').html());

        //individual carousel block template
        Carousel.Templates.block = _.template($('#block-template').html());


        // VIEWS -------------------------------------------------------------------------------------------------------
        // carousel container view
        Carousel.Views.Carousel = Backbone.View.extend({
            el: $('.app'),
            template: Carousel.Templates.carousel,

            events: {
                'click .nav-prev': 'onPrevClick',
                'click .nav-next': 'onNextClick'
            },

            initialize: function () {
                // Show loading message while request is in progress
                this.collection.on('request', function () {
                    $(this.el).empty().append('<p class="loading">Loading...</p>');
                }, this);

                // start with the first screen (first 4 or less blocks)
                this.currentScreen = 1;
                this.firstStep = true;
                this.lastStep = false;

                // resize blocks and carousel on window resize
                $(window).on('resize', this.setDimensions);
            },

            // render view on fetch success, set carousel dimensions and navigation buttons states
            onFetchSuccess: function (response) {
                this.render();
                this.totalBlocks = response.length;
                this.setDimensions();
                this.setNavButtonsState();
            },
            render: function () {
                // populate .app with template
                $(this.el).html(this.template());

                // cache carousel wrappers, blocks and navigation buttons
                this.innerWrapper = $('.carousel-wrapper-inner');
                this.carouselBlock = $('.carousel-block');
                this.navPrev = $('.nav-prev');
                this.navNext = $('.nav-next');

                // popuplate inner carousel wrapper with a view for each individual block
                this.collection.each(function (model) {
                    var view = new Carousel.Views.Block({
                        model: model
                    });
                    $('.carousel-wrapper-inner').append(view.render());
                });
            },

            onFetchFail: function () {
                $(this.el).empty().append('<h3>Unable to load data!</h3>');
            },

            setDimensions: function () {
                // get document width, set as a property to reuse in prev/next functions
                this.docWidth = $(document).width();

                // calculate single block width, if more than 1000 - set to 240px (for 960 container with 20 padding)
                this.singleBlockWidth = (this.docWidth > 1000) ? 240 : ((this.docWidth - 40) / 4);

                // set carousel wrapper and carousel blocks widths
                $('.carousel-wrapper-inner').css('width', this.totalBlocks * this.singleBlockWidth);
                $('.carousel-block').css('width', this.singleBlockWidth);
            },

            // calculate total amount of screens from number of fetched objects
            getTotalScreens: function () {
                return Math.ceil(this.totalBlocks / 4);
            },

            // set navigation buttons states
            setNavButtonsState: function () {
                if (this.currentScreen === 1) {
                    this.navPrev.addClass('disabled');
                    this.firstStep = true;
                } else {
                    this.navPrev.removeClass('disabled');
                    this.firstStep = false;
                }

                if (this.currentScreen === this.getTotalScreens()) {
                    this.navNext.addClass('disabled');
                    this.lastStep = true;
                } else {
                    this.navNext.removeClass('disabled');
                    this.lastStep = false;
                }
            },

            // navigation click handlers
            // throttle for transition time, to prevent half finished transitions before the next one starts
            onPrevClick: _.throttle(function () {
                if (this.firstStep) {
                    return false;
                }

                // get current transform translateX value
                var transform = this.innerWrapper.css('transform').split(/[()]/)[1],
                    posX = parseInt(transform.split(',')[4]),
                    newPosX = posX + this.singleBlockWidth * 4;
                console.log(newPosX);

                // set new transform translateX value, update currentScreen value and navigation state
                this.innerWrapper.css('transform', 'translateX(' + newPosX + 'px)');
                this.currentScreen--;
                this.setNavButtonsState();
            }, 300),

            onNextClick: _.throttle(function () {
                if (this.lastStep) {
                    return false;
                }

                // get current transform translateX value
                var transform = this.innerWrapper.css('transform').split(/[()]/)[1],
                    posX = parseInt(transform.split(',')[4]),
                    newPosX = posX - this.singleBlockWidth * 4;
                console.log(newPosX);

                // set new transform translateX value, update currentScreen value and navigation state
                this.innerWrapper.css('transform', 'translateX(' + newPosX + 'px)');
                this.currentScreen++;
                this.setNavButtonsState();
            }, 300)
        });

        // individual carousel block view
        Carousel.Views.Block = Backbone.View.extend({
            className: 'carousel-block',
            template: Carousel.Templates.block,

            render: function () {
                return $(this.el).append(this.template(this.model.toJSON()));
            }
        });


        // ROUTER ------------------------------------------------------------------------------------------------------
        Carousel.Router = Backbone.Router.extend({
            routes: {
                '': 'home'
            },

            // populate Carousel view with collection, fetch and trigger render via reset (set to true)
            home: function () {
                var blocks = new Carousel.Collections.Blocks();
                var carouselView = new Carousel.Views.Carousel({collection: blocks});
                blocks.fetch({
                    // success and error handling
                    success: function (response) {
                        console.log('success', response);
                        carouselView.onFetchSuccess(response);
                    },
                    error: function (collection, response, options) {
                        console.log(collection, response, options);
                        carouselView.onFetchFail();
                    }
                });
            }
        });

        // initialize a new router
        var router = new Carousel.Router();

        // start the application
        Backbone.history.start();
    });
}(jQuery));