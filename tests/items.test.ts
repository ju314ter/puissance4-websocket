import Items from '../src/classes'

describe('Items', () => {
    it('should return first item', ()=>{
        expect(Items.getFirstItem()).toBe('Item 1')
    })
})