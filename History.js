class History {
    constructor(size = 100, { key = false } = {}) {
        this.size = size
        this.store = []
        this.pushTo = []
        this.key = key
        //store will be
    }
    onpush(cb) {
        this.pushTo.push(cb)
        return this.pushTo.length - 1
    }
    unpush(index) {
        this.pushTo.splice(index, 1)
    }
    push(state) {
        if (this.store.length === this.size) {
            this.store.pop()
        }
        if (this.key !== false) {
            if (this.has(this.key, state[this.key]) || !state[this.key]) {
                return false
            }
        }

        this.store.push(state)
        this.pushTo.forEach(cb => cb(state, this.store.length))
        return this.store.length
    }
    pop() {
        return this.store.pop()
    }
    get(index) {
        return this.store[index]
    }
    getNewest(howMany = 1) {
        const ret = this.store.slice(-howMany)
        if (howMany === 1) {
            return ret[0]
        }
        ret.reverse()
        return ret
    }
    getOldest(howMany = 1) {
        const ret = this.store.slice(0, howMany)
        if (howMany === 1) {
            return ret[0]
        }
        return ret
    }
    getAll() {
        return this.store
    }
    has(key, value) {
        return this.store.some(item => item[key] == value)
    }
    clear() {
        this.store = []
    }
}
module.exports = History