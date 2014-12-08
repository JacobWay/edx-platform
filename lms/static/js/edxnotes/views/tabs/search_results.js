;(function (define, undefined) {
'use strict';
define([
    'gettext', 'backbone', 'js/edxnotes/views/note_item',
    'js/edxnotes/views/tab_view', 'js/edxnotes/views/search_box', 'jquery.highlight'
], function (gettext, Backbone, NoteItemView, TabView, SearchBoxView) {
    var SearchResultsView = TabView.extend({
        SubViewConstructor: Backbone.View.extend({
            tagName: 'section',
            className: 'tab-panel',
            id: 'search-results-panel',
            attributes: {
                'tabindex': -1
            },
            highlightMatchedText: true,
            render: function () {
                var container = document.createDocumentFragment();
                container.appendChild(this.getTitle());
                this.collection.each(function (model) {
                    var item = new NoteItemView({model: model});
                    container.appendChild(item.render().el);
                });
                this.$el.html(container);

                if (this.highlightMatchedText) {
                    this.$('.note-comment-p').highlight(this.options.searchQuery, {
                        element: 'span',
                        className: 'note-highlight',
                        caseSensitive: false,
                        wordsOnly: false
                    });
                }
                return this;
            },

            getTitle: function () {
                return $('<h2></h2>', {
                    'class': 'sr',
                    'text': gettext('Search Results')
                }).get(0);
            }
        }),

        NoResultsViewConstructor: Backbone.View.extend({
            tagName: 'section',
            className: 'tab-panel',
            id: 'no-results-panel',
            attributes: {
                'tabindex': -1
            },
            render: function () {
                var message = gettext('No results found for "%(query_string)s".');
                this.$el.html(interpolate(message, {
                    query_string: this.options.searchQuery
                }, true));
                return this;
            }
        }),

        tabInfo: {
            identifier: 'view-search-results',
            name: gettext('Search Results'),
            icon: 'icon-search',
            is_closable: true
        },

        initialize: function (options) {
            _.bindAll(this, 'onBeforeSearchStart', 'onSearch', 'onSearchError');
            TabView.prototype.initialize.call(this, options);
            this.searchResults = null;
            this.searchBox = new SearchBoxView({
                el: document.getElementById('search-notes-form'),
                user: this.options.user,
                courseId: this.options.courseId,
                debug: this.options.debug,
                beforeSearchStart: this.onBeforeSearchStart,
                search: this.onSearch,
                error: this.onSearchError
            });
        },

        renderContent: function () {
            this.getLoadingIndicator().focus();
            return this.searchPromise.done(_.bind(function () {
                this.contentView = this.getSubView();
                if (this.contentView) {
                    this.$('.wrapper-tabs').append(this.contentView.render().$el);
                }
            }, this));
        },

        getSubView: function () {
            var collection = this.getCollection();
            if (collection) {
                if (collection.length) {
                    return new this.SubViewConstructor({
                        collection: collection,
                        searchQuery: this.searchResults.searchQuery
                    });
                } else {
                    return new this.NoResultsViewConstructor({
                        searchQuery: this.searchResults.searchQuery
                    });
                }
            }

            return null;
        },

        getCollection: function () {
            if (this.searchResults) {
                return this.searchResults.collection;
            }

            return null;
        },

        onClose: function () {
            this.searchResults = null;
        },

        onBeforeSearchStart: function () {
            this.searchDeferred = $.Deferred();
            this.searchPromise = this.searchDeferred.promise();
            this.hideErrorMessage();
            this.searchResults = null;
            // If tab doesn't exist, creates it.
            if (!this.tabModel) {
                this.createTab();
            }
            // If tab is not already active, makes it active
            if (!this.tabModel.isActive()) {
                this.tabModel.activate();
            } else {
                this.render();
            }
        },

        onSearch: function (collection, total, searchQuery) {
            this.searchResults = {
                collection: collection,
                total: total,
                searchQuery: searchQuery
            };

            if (this.searchDeferred) {
                this.searchDeferred.resolve();
            }

            if (this.contentView) {
                this.contentView.$el.focus();
            }
        },

        onSearchError: function (errorMessage) {
            this.showErrorMessage(errorMessage);
            if (this.searchDeferred) {
                this.searchDeferred.reject();
            }
        }
    });

    return SearchResultsView;
});
}).call(this, define || RequireJS.define);
