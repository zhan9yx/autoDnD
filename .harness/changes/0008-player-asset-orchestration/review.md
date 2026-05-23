# Requirement Review

Approved with constraints.

- The existing UI exposes an asset library inside the GM drawer. That is product-inappropriate for a player-facing run table and must be removed or hidden from normal play.
- The asset catalog is still valuable as runtime infrastructure. The implementation should keep loading manifests for scene matching, rewards, and future expansion, but not render the full catalog to users.
- This iteration should add another real generated batch and richer metadata, but the long-term "thousands of assets" target remains a staged catalog expansion, not a false completion claim.
- Event rewards and scene shifts should be deterministic enough to test without relying on an LLM response.
