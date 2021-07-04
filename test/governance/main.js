const HugoDaoProxy = artifacts.require('HugoDaoProxy');
const HugoDao = artifacts.require('HugoDao');



contract('XXXX', function (accounts) {
    beforeEach(async function () {
        // proxy interface
        this.proxy = await HugoDaoProxy.new('0x93E05804b0A58668531F65A93AbfA1aD8F7F5B2b', 1231231, 80640, 40320, '50000000000000000000000');
        // same contract, but dao interface
        this.dao = await HugoDao.at(this.proxy.address);
    });

    it('has a name', async function () {
        name = 'HUGO';
        expect(await this.dao.name()).to.equal(name);
    });

});