import persons from "./fixtures.json";
import { logFixture } from "./helpers";

(persons as Person[]).forEach(logFixture);
