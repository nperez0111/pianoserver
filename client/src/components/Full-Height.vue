<template>
    <v-parallax :src="src" :height="height" v-if="parallax">
        <v-layout v-resize="onResize" :style="style" :class="mainClass" v-if="parallax">
            <slot></slot>
        </v-layout>
    </v-parallax>
    <v-layout v-resize="onResize" :style="style" :class="mainClass" v-else>
        <slot></slot>
    </v-layout>
</template>
<script>
const mainToolBarHeight = 48
export default {
    data() {
        return {
            windowSize: {
                x: 0,
                y: 0
            },
            classes: []
        }
    },
    mounted() {
        this.classes = Object.keys(this.$attrs || {}).map(key => {
            const value = this.$attrs[key]
            return ((typeof value === 'string') || value) ? key : false
        }).filter(Boolean)

        this.onResize()
    },
    computed: {
        style() {
            return {
                height: this.full ? this.height / this.divisor + 'px' : 'auto'
            }
        },
        mainClass() {
            const defaultLayoutClasses = 'column justify-center',
                layoutClasses = this.classes.join(' ') || defaultLayoutClasses
            return layoutClasses
        },
        height() {
            return this.windowSize.y - mainToolBarHeight
        }
    },
    props: {
        parallax: Boolean,
        src: String,
        full: {
            type: Boolean,
            default: true
        },
        divisor: {
            type: Number,
            default: 1
        }
    },
    methods: {
        onResize() {
            this.windowSize = {
                x: window.innerWidth,
                y: window.innerHeight
            }
        }
    }
}
</script>