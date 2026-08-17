export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0].trim() : "") || request.headers.get("x-real-ip");
  return ip || "unknown";
}