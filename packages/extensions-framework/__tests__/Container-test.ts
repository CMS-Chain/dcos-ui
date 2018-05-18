import Container from "../src/Container";

describe("Container", () => {
  describe("bind", () => {
    it("emitts BOUND event with the service identifier", done => {
      const container = new Container();
      container.addEventListener(Container.BOUND, serviceIdentifier => {
        expect(serviceIdentifier).toBe("Mock");
        done();
      });

      container.bind("Mock").toConstantValue(1);
    });
  });

  describe("unbind", () => {
    it("emitts UNBOUND event with the service identifier", done => {
      const container = new Container();
      container.addEventListener(Container.UNBOUND, serviceIdentifier => {
        expect(serviceIdentifier).toBe("Mock");
        done();
      });

      container.bind("Mock").toConstantValue(1);
      container.unbind("Mock");
    });
  });

  describe("rebind", () => {
    it("emitts REBOUND event with the service identifier", done => {
      const container = new Container();
      container.addEventListener(Container.REBOUND, serviceIdentifier => {
        expect(serviceIdentifier).toBe("Mock");
        done();
      });

      container.bind("Mock").toConstantValue(1);
      container.rebind("Mock").toConstantValue(2);
    });
  });
});
