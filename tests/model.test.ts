import { describe, it, expect } from "vitest";
import {
  effectiveProfile,
  syncFields,
  setOverride,
  emptyProfile,
  defaultDesign,
  moveItem,
  profileCompletion,
  type CVDocument,
} from "../src/lib/model";
function doc(): CVDocument {
  const profile = emptyProfile();
  profile.personal.full_name = "Avery";
  profile.sections.education = [
    { id: "education-1", institution: "University", grade: "8.5" },
  ];
  return {
    id: "doc-a",
    user_id: "user-a",
    title: "Internship",
    document_type: "Resume",
    purpose: "Internship",
    target_role: "Engineer",
    target_organization: "",
    job_description: "",
    template_id: "modern",
    profile_snapshot: profile,
    document_overrides: {},
    included_sections: ["education"],
    design_settings: defaultDesign(),
    revision: 1,
    archived: false,
    created_at: "",
    updated_at: "",
  };
}
describe("independent document information", () => {
  it("changes only the requested field and preserves snapshot and design", () => {
    const original = doc();
    const edited = {
      ...original,
      document_overrides: setOverride(
        original.document_overrides,
        "education/education-1/grade",
        "9.2",
      ),
    };
    expect(effectiveProfile(edited).sections.education[0].grade).toBe("9.2");
    expect(original.profile_snapshot.sections.education[0].grade).toBe("8.5");
    expect(edited.design_settings).toEqual(original.design_settings);
    expect(effectiveProfile(edited).personal).toEqual(
      original.profile_snapshot.personal,
    );
  });
  it("selectively syncs master fields and retains customized wording by default", () => {
    const d = doc();
    d.document_overrides = { "education/education-1/grade": "Custom grade" };
    const master = structuredClone(d.profile_snapshot);
    master.personal.full_name = "Different name";
    master.sections.education[0].grade = "9.4";
    const synced = syncFields(
      d,
      master,
      ["education/education-1/grade"],
      false,
    );
    expect(effectiveProfile(synced).sections.education[0].grade).toBe(
      "Custom grade",
    );
    expect(synced.profile_snapshot.sections.education[0].grade).toBe("9.4");
    expect(synced.profile_snapshot.personal.full_name).toBe("Avery");
    expect(synced.design_settings).toEqual(d.design_settings);
  });
  it("replaces an override only when explicitly selected", () => {
    const d = doc();
    d.document_overrides = {
      "education/education-1/grade": "Custom",
      "personal/full_name": "Preferred name",
    };
    const master = structuredClone(d.profile_snapshot);
    master.sections.education[0].grade = "9.7";
    const synced = syncFields(d, master, ["education/education-1/grade"], true);
    expect(effectiveProfile(synced).sections.education[0].grade).toBe("9.7");
    expect(effectiveProfile(synced).personal.full_name).toBe("Preferred name");
    expect(d.document_overrides["education/education-1/grade"]).toBe("Custom");
  });
  it("does not leak mutations across duplicated document snapshots", () => {
    const original = doc();
    const copy = structuredClone(original);
    copy.profile_snapshot.personal.full_name = "Another application";
    expect(original.profile_snapshot.personal.full_name).toBe("Avery");
  });
  it("reorders records without dropping values and guards boundaries", () => {
    const items = ["a", "b", "c"];
    expect(moveItem(items, 0, -1)).toEqual(items);
    expect(moveItem(items, 1, 1)).toEqual(["a", "c", "b"]);
    expect(items).toEqual(["a", "b", "c"]);
  });
  it("reports empty profile completion accurately", () =>
    expect(profileCompletion(emptyProfile())).toBe(0));
});
