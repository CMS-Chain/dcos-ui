const mockRequest = jest.fn();
jest.mock("@dcos/http-service", () => ({
  request: mockRequest
}));

import { marbles } from "rxjs-marbles/jest";

import * as MetronomeClient from '../MetronomeClient';
import Config from "../../config/Config";

describe("MetronomeClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("#createJob", () => {
    const jobData = {
      id: "/myJob/is/the/best",
      run: {
        cpus: 0.1,
        mem: 42,
        disk: 0
      }
    };

    it("makes a request", () => {
      MetronomeClient.createJob(jobData);
      expect(mockRequest).toHaveBeenCalled();
    });

    it("sends data to the correct URL", () => {
      MetronomeClient.createJob(jobData);
      expect(mockRequest).toHaveBeenCalledWith(`${Config.metronomeAPI}/v0/scheduled-jobs`, expect.anything());
    });

    it("sends request with the correct method", () => {
      MetronomeClient.createJob(jobData);
      expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {body: expect.anything(), method: "POST"});
    });

    it("sends request with the correct stringified data", () => {
      MetronomeClient.createJob(jobData);
      expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {body: JSON.stringify(jobData), method: expect.anything()});
    });

    it("emits the sucessful request result", marbles(function(m){
      m.bind();

      const expected$ = m.cold("--j|", {
        j: jobData
      });

      mockRequest.mockReturnValueOnce(expected$);
      const result$ = MetronomeClient.createJob(jobData);

      m.expect(result$).toBeObservable(expected$);
    }));
  });

  describe("#fetchJobs", () => {
    it("makes a request", () => {
      MetronomeClient.fetchJobs();
      expect(mockRequest).toHaveBeenCalled();
    });

    it("sends data to the correct URL", () => {
      MetronomeClient.fetchJobs();
      expect(mockRequest).toHaveBeenCalledWith(`${Config.metronomeAPI}/v1/jobs?embed=activeRuns&embed=schedules&embed=historySummary`, expect.anything());
    });

    it("debounces on error");
    it("emits an event if the data is received");
    it("emits an event on error");
    describe("request in progress", () => {
      it("emits an event");
      it("doesn't make a request");
    })
  })
});
