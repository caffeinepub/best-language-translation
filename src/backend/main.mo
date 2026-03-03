import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

actor {
  type Record = {
    id : Nat;
    sourceText : Text;
    sourceLang : Text;
    targetLang : Text;
    translatedText : Text;
    timestampNanos : Int;
  };

  module Record {
    public func compareByTimestampNewestFirst(record1 : Record, record2 : Record) : Order.Order {
      Int.compare(record2.timestampNanos, record1.timestampNanos);
    };
  };

  var nextId = 0;
  var records = Array.empty<Record>();

  public shared ({ caller }) func saveTranslation(sourceText : Text, sourceLang : Text, targetLang : Text, translatedText : Text) : async () {
    let timestamp = 0;
    let record : Record = {
      id = nextId;
      sourceText;
      sourceLang;
      targetLang;
      translatedText;
      timestampNanos = timestamp;
    };
    records := records.concat([record]);
    nextId += 1;
  };

  public query ({ caller }) func getAllHistory() : async [Record] {
    records.sort(Record.compareByTimestampNewestFirst);
  };

  public shared ({ caller }) func deleteRecord(id : Nat) : async () {
    let index = records.findIndex(func(record) { record.id == id });
    switch (index) {
      case (null) { Runtime.trap("Record not found") };
      case (?i) {
        records := Array.tabulate(
          records.size() - 1,
          func(j) { if (j < i) { records[j] } else { records[j + 1] } },
        );
      };
    };
  };

  public shared ({ caller }) func clearHistory() : async () {
    records := Array.empty<Record>();
  };
};
