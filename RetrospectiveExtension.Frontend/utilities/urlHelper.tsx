export const buildAvatarUrl = (id: string): string => {
    const hostUri = VSS.getWebContext().host.uri;

    if (!(id == null || id.trim() === '')) {
        return `${hostUri}/_api/_common/IdentityImage?id=${id}`;
    }

    return null;
};
